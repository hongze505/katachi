using katachi.Models.Records;
using katachi.Models.Stats;

namespace katachi.Models.Training
{
    public class TrainingLogViewModel
    {
        public List<PrRecord> PrList { get; set; } = new();
        public List<RmRecord> RmList { get; set; } = new();
        public ActivityStats Activity { get; set; } = new();
        public Dictionary<string, List<TrainingItem>> MonthlyData { get; set; } = new();
        public List<string> AvailableMonths { get; set; } = new();
        public List<int> AvailableYears { get; set; } = new();
        public List<MuscleGroupStat> WeightedData { get; set; } = new();
        public List<MuscleGroupStat> PrimaryData { get; set; } = new();
    }
}
