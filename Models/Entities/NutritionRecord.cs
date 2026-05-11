using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("nutrition_records")]
    public class NutritionRecord
    {
        [Key]
        [Column("record_id")]
        public int RecordId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("food_id")]
        public int FoodId { get; set; }

        public decimal Grams { get; set; }

        [Column("record_date")]
        public DateOnly RecordDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // 導航屬性
        public User User { get; set; }
        public Food Food { get; set; }
    }
}
