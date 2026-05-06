using System.Text.Json.Serialization;

namespace FinApi.Models.Finnhub;

public class FinnhubProfile
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("exchange")]
    public string Exchange { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = string.Empty;

    [JsonPropertyName("marketCapitalization")]
    public double MarketCapitalization { get; set; }

    [JsonPropertyName("shareOutstanding")]
    public double ShareOutstanding { get; set; }
}
