using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("day_template_exercises")]
    public class DayTemplateExercise
    {
        public int Id { get; set; }

        [Column("day_template_id")]
        public int DayTemplateId { get; set; }

        [Column("ex_key")]
        public string ExKey { get; set; }

        [Column("sort_order")]
        public int SortOrder { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // 導航屬性
        public DayTemplate DayTemplate { get; set; }
        public Exercise Exercise { get; set; }
    }
}