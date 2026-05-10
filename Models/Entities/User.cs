using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public int UserId { get; set; }

        public string Name { get; set; }
        public string Email { get; set; }

        [Column("password_hash")]
        public string PasswordHash { get; set; }

        public string Username { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        public string? Gender { get; set; }
        public int? Age { get; set; }

        [Column("height_cm")]
        public decimal? HeightCm { get; set; }

        [Column("weight_kg")]
        public decimal? WeightKg { get; set; }

        public string? Activity { get; set; }

        [Column("profile_updated_at")]
        public DateTime? ProfileUpdatedAt { get; set; }

        // 導航屬性
        public ICollection<NutritionRecord> NutritionRecords { get; set; }
    }
}
