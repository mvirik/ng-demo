using FinApi.Models;
using FinApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinApi.Controllers;

[ApiController]
[Route("api/stocks")]
public class StocksController(FinnhubHttpService finnhubHttp) : ControllerBase
{
    [HttpGet("{symbol}/details")]
    public async Task<IActionResult> GetDetails(string symbol, CancellationToken ct)
    {
        var normalised = symbol.ToUpperInvariant();

        var quoteTask = finnhubHttp.GetQuoteAsync(normalised, ct);
        var profileTask = finnhubHttp.GetProfileAsync(normalised, ct);
        await Task.WhenAll(quoteTask, profileTask);

        var quote = await quoteTask;
        var profile = await profileTask;

        if (quote is null || profile is null)
            return StatusCode(502, "Upstream data unavailable.");

        if (string.IsNullOrEmpty(profile.Name))
            return NotFound($"Symbol '{normalised}' not found.");

        var details = new StockDetailsResponse(
            Symbol: normalised,
            Name: profile.Name,
            Exchange: profile.Exchange,
            Currency: profile.Currency,
            CurrentPrice: quote.CurrentPrice,
            OpenPrice: quote.OpenPrice,
            HighPrice: quote.HighPrice,
            LowPrice: quote.LowPrice,
            Volume: profile.ShareOutstanding,
            MarketCap: profile.MarketCapitalization,
            PriceChange: quote.PriceChange,
            PriceChangePercent: quote.PriceChangePercent
        );

        return Ok(details);
    }
}
