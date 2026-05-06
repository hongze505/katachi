using System.ComponentModel.DataAnnotations.Schema;

namespace katachi.Models.Entities
{
    [Table("exercises")]
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; }

        [Column("muscle_group")]
        public string MuscleGroup { get; set; }

        [Column("movement_type")]
        public string MovementType { get; set; }

        public string Equipment { get; set; }

        [Column("is_compound")]
        public bool IsCompound { get; set; }

        public List<ExerciseGoal> Goals { get; set; }
    }
}
