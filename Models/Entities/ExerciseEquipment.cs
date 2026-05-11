using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("exercise_equipment")]
    public class ExerciseEquipment
    {
        [Key]
        [Column("ex_key")]
        public string ExKey { get; set; }

        [Column("equipment_id")]
        public int EquipmentId { get; set; }

        // 導航屬性
        public Exercise Exercise { get; set; }
        public Equipment Equipment { get; set; }
    }
}
