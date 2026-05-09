using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("exercises")]
    public class Exercise
    {
        [Key]
        [Column("ex_key")]
        public string ExKey { get; set; }

        [Column("name_zh")]
        public string NameZh { get; set; }

        // 導航屬性
        public ExerciseEquipment? ExerciseEquipment { get; set; }
        public ICollection<ExerciseGroupPct> ExerciseGroupPcts { get; set; }
        public ICollection<ExerciseGoal> Goals { get; set; }
    }
}