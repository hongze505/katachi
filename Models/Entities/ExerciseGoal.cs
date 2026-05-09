using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("exercise_goals")]
    public class ExerciseGoal
    {
        public int Id { get; set; }

        [Column("ex_key")]
        public string ExKey { get; set; }

        public string Goal { get; set; }
        public int Sets { get; set; }
        public string Reps { get; set; }

        [Column("rest_seconds")]
        public string RestSeconds { get; set; }

        // 導航屬性
        public Exercise Exercise { get; set; }
    }
}