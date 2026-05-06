using Microsoft.EntityFrameworkCore;
using katachi.Models.Entities;

namespace katachi.Models
{
    public class KatachiDbContext : DbContext
    {
        public KatachiDbContext(DbContextOptions<KatachiDbContext> options)
            : base(options) { }

        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<ExerciseGoal> ExerciseGoals { get; set; }
        public DbSet<DayTemplate> DayTemplates { get; set; }
        public DbSet<DayTemplateExercise> DayTemplateExercises { get; set; } // ⭐ 新增
    }
}