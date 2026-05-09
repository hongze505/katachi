using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("equipment")]
    public class Equipment
    {
        public int Id { get; set; }
        public string Name { get; set; }

        // 導航屬性
        public ICollection<ExerciseEquipment> ExerciseEquipments { get; set; }
    }
}
