namespace FinApi.Models;

public record StockDetailsResponse(
    string Symbol,
    string Name,
    string Exchange,
    string Currency,
    double CurrentPrice,
    double OpenPrice,
    double HighPrice,
    double LowPrice,
    double Volume,
    double MarketCap,
    double PriceChange,
    double PriceChangePercent
);
