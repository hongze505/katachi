namespace katachi.Models.Program
{
    public class DayPlan
    {
        public int DayNumber { get; set; }
        public string DayName { get; set; }
        public List<ExerciseItem> Exercises { get; set; }
    }

    public class ExerciseItem
    {
        public string Name { get; set; }
        public string MuscleGroup { get; set; }
        public string Equipment { get; set; }
        public int Sets { get; set; }
        public string Reps { get; set; }
        public string RestSeconds { get; set; }
    }

    public class PlanResult
    {
        public List<DayPlan> WeekDays { get; set; }
        public Prescription Prescription { get; set; }
    }

    public class Prescription
    {
        public int Sets { get; set; }
        public string Reps { get; set; }
        public string Rest { get; set; }
    }
}
