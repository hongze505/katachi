using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace katachi.Models.Entities
{
    [Table("exercise_group_pct")]
    [PrimaryKey(nameof(ExKey), nameof(GroupKey))]
    public class ExerciseGroupPct
    {
        [Column("ex_key")]
        public string ExKey { get; set; }

        [Column("group_key")]
        public string GroupKey { get; set; }

        public byte Pct { get; set; }

        // 導航屬性
        public Exercise Exercise { get; set; }
        public MuscleGroup MuscleGroup { get; set; }
    }
}