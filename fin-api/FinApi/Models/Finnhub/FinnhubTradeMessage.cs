using System.Text.Json.Serialization;

namespace FinApi.Models.Finnhub;

public class FinnhubTradeMessage
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public List<FinnhubTrade> Data { get; set; } = [];
}

public class FinnhubTrade
{
    [JsonPropertyName("s")]
    public string Symbol { get; set; } = string.Empty;

    [JsonPropertyName("p")]
    public double Price { get; set; }

    [JsonPropertyName("t")]
    public long Timestamp { get; set; }

    [JsonPropertyName("v")]
    public double Volume { get; set; }
}
