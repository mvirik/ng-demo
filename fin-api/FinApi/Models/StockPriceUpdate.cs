namespace FinApi.Models;

public record StockPriceUpdate(string Symbol, double Price, long Timestamp);
