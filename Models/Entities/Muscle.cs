using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("muscles")]
    public class Muscle
    {
        [Key]
        [Column("muscle_key")]
        public string MuscleKey { get; set; }

        [Column("group_key")]
        public string GroupKey { get; set; }

        // 導航屬性
        public MuscleGroup MuscleGroup { get; set; }
    }
}
