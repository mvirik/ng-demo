using System.Net.Http.Json;
using FinApi.Models.Finnhub;

namespace FinApi.Services;

public class FinnhubHttpService(HttpClient httpClient, IConfiguration configuration)
{
    private readonly string _apiKey = configuration["Finnhub:ApiKey"]
        ?? throw new InvalidOperationException("Finnhub:ApiKey is not configured.");

    public Task<FinnhubQuote?> GetQuoteAsync(string symbol, CancellationToken ct = default)
        => httpClient.GetFromJsonAsync<FinnhubQuote>(
            $"quote?symbol={Uri.EscapeDataString(symbol)}&token={_apiKey}", ct);

    public Task<FinnhubProfile?> GetProfileAsync(string symbol, CancellationToken ct = default)
        => httpClient.GetFromJsonAsync<FinnhubProfile>(
            $"stock/profile2?symbol={Uri.EscapeDataString(symbol)}&token={_apiKey}", ct);
}
