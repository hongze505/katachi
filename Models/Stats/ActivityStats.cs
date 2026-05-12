namespace katachi.Models.Stats
{
    public class ActivityStats
    {
        public double MonthlyAvg { get; set; }
        public int DaysSinceLast { get; set; }
        public int DaysUntilNext { get; set; }
        public int TotalSets { get; set; }
        public int RestDays { get; set; }
        public int WeekStreak { get; set; }
    }
}
