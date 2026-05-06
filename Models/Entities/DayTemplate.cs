using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("day_templates")]
    public class DayTemplate
    {
        public int Id { get; set; }

        [Column("total_days")]
        public int TotalDays { get; set; }

        [Column("day_number")]
        public int DayNumber { get; set; }

        [Column("day_name")]
        public string DayName { get; set; }

        [Column("target_groups")]
        public string TargetGroups { get; set; }

        [Column("exercise_count")]
        public int ExerciseCount { get; set; }
    }
}
