using System.Text.Json.Serialization;

namespace katachi.Models.Training
{
    public class TrainingItem
    {
        [JsonPropertyName("itemId")] public int ItemId { get; set; }
        [JsonPropertyName("ex")] public string ExKey { get; set; } = "";
        [JsonPropertyName("w")] public decimal Weight { get; set; }
        [JsonPropertyName("s")] public int Sets { get; set; }
        [JsonPropertyName("r")] public int Reps { get; set; }
        [JsonPropertyName("d")] public List<int> Done { get; set; } = new();
    }
}
