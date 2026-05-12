using System.Text.Json.Serialization;

namespace katachi.Models.Stats
{
    public class MuscleGroupStat
    {
        [JsonPropertyName("groupKey")] public string GroupKey { get; set; } = "";
        [JsonPropertyName("value")] public double Value { get; set; }
    }
}
