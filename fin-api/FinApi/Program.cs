using FinApi.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// CORS — allow Angular dev server
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:4200"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Controllers
builder.Services.AddControllers();

// Finnhub HTTP service (typed client for StocksController)
builder.Services.AddHttpClient<FinnhubHttpService>(client =>
{
    var baseUrl = builder.Configuration["Finnhub:BaseUrl"]
        ?? throw new InvalidOperationException("Finnhub:BaseUrl is not configured.");
    client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + '/');
});

// Named "finnhub" client for FinnhubWebSocketService (avoids captive dependency with singleton)
builder.Services.AddHttpClient("finnhub", client =>
{
    var baseUrl = builder.Configuration["Finnhub:BaseUrl"]
        ?? throw new InvalidOperationException("Finnhub:BaseUrl is not configured.");
    client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + '/');
});

// Finnhub WebSocket background service
builder.Services.AddSingleton<FinnhubWebSocketService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<FinnhubWebSocketService>());

// OpenAPI / Scalar
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseWebSockets();

app.Map("/ws/stocks", async (HttpContext context, FinnhubWebSocketService finnhubWs) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }
    var ws = await context.WebSockets.AcceptWebSocketAsync();
    await finnhubWs.HandleClientAsync(ws, context.RequestAborted);
});

app.MapControllers();

app.Run();
