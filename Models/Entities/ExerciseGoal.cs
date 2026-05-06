using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("exercise_goals")]
    public class ExerciseGoal
    {
        public int Id { get; set; }

        [Column("exercise_id")]
        public int ExerciseId { get; set; }

        public string Goal { get; set; }
        public int Sets { get; set; }
        public string Reps { get; set; }          // ⭐ 合併後的欄位

        [Column("rest_seconds")]
        public string RestSeconds { get; set; }

        public Exercise Exercise { get; set; }
    }
}