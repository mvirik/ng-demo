using System.Text.Json.Serialization;

namespace FinApi.Models.Finnhub;

public class FinnhubQuote
{
    [JsonPropertyName("c")]
    public double CurrentPrice { get; set; }

    [JsonPropertyName("o")]
    public double OpenPrice { get; set; }

    [JsonPropertyName("h")]
    public double HighPrice { get; set; }

    [JsonPropertyName("l")]
    public double LowPrice { get; set; }

    [JsonPropertyName("d")]
    public double PriceChange { get; set; }

    [JsonPropertyName("dp")]
    public double PriceChangePercent { get; set; }
}
