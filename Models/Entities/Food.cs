using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("foods")]
    public class Food
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; }

        [Column("name_en")]
        public string? NameEn { get; set; }

        public decimal Calories { get; set; }
        public decimal Protein { get; set; }
        public decimal Carbs { get; set; }
        public decimal Fat { get; set; }
        public string Unit { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // 導航屬性
        public ICollection<NutritionRecord> NutritionRecords { get; set; }
    }
}
