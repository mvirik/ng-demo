using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using FinApi.Models;
using FinApi.Models.Finnhub;

namespace FinApi.Services;

public sealed class FinnhubWebSocketService : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FinnhubWebSocketService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ConcurrentDictionary<string, byte> _subscribedSymbols = new();
    private readonly ConcurrentDictionary<Guid, WebSocket> _clients = new();

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public FinnhubWebSocketService(
        IConfiguration configuration,
        ILogger<FinnhubWebSocketService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task HandleClientAsync(WebSocket clientWs, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        _clients.TryAdd(id, clientWs);
        try
        {
            var buffer = new byte[1024];
            while (clientWs.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                using var ms = new MemoryStream();
                WebSocketReceiveResult result;
                do
                {
                    result = await clientWs.ReceiveAsync(buffer, ct);
                    ms.Write(buffer, 0, result.Count);
                } while (!result.EndOfMessage);

                if (result.MessageType == WebSocketMessageType.Close) break;

                HandleClientMessage(Encoding.UTF8.GetString(ms.ToArray()));
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            _clients.TryRemove(id, out _);
            if (clientWs.State == WebSocketState.Open)
                await clientWs.CloseAsync(WebSocketCloseStatus.NormalClosure, "Disconnected", CancellationToken.None);
        }
    }

    private void HandleClientMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var typeProp) ||
                !root.TryGetProperty("symbol", out var symbolProp))
                return;

            var symbol = symbolProp.GetString()?.ToUpperInvariant();
            if (symbol is null) return;

            if (typeProp.GetString() == "subscribe")
            {
                _subscribedSymbols.TryAdd(symbol, 0);
                _logger.LogInformation("Client subscribed to {Symbol}.", symbol);
            }
            else if (typeProp.GetString() == "unsubscribe")
            {
                _subscribedSymbols.TryRemove(symbol, out _);
                _logger.LogInformation("Client unsubscribed from {Symbol}.", symbol);
            }
        }
        catch (JsonException) { }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            if (_subscribedSymbols.IsEmpty || _clients.IsEmpty) continue;
            await PollAndBroadcastAsync(stoppingToken);
        }
    }

    private async Task PollAndBroadcastAsync(CancellationToken ct)
    {
        var apiKey = _configuration["Finnhub:ApiKey"] ?? string.Empty;
        using var http = _httpClientFactory.CreateClient("finnhub");

        var tasks = _subscribedSymbols.Keys.Select(async symbol =>
        {
            try
            {
                var quote = await http.GetFromJsonAsync<FinnhubQuote>(
                    $"quote?symbol={Uri.EscapeDataString(symbol)}&token={apiKey}", ct);

                if (quote is null) return;

                var update = new StockPriceUpdate(
                    symbol,
                    quote.CurrentPrice,
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

                await BroadcastAsync(update, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed to fetch quote for {Symbol}.", symbol);
            }
        });

        await Task.WhenAll(tasks);
    }

    private async Task BroadcastAsync(StockPriceUpdate update, CancellationToken ct)
    {
        var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(update, JsonOptions));
        foreach (var (id, ws) in _clients)
        {
            if (ws.State != WebSocketState.Open) continue;
            try
            {
                await ws.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, ct);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to broadcast to client {Id}.", id);
            }
        }
    }

    public override void Dispose()
    {
        base.Dispose();
    }
}
