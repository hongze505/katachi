using Microsoft.EntityFrameworkCore;
using katachi.Models.Entities;

namespace katachi.Models
{
    public class KatachiDbContext : DbContext
    {
        public KatachiDbContext(DbContextOptions<KatachiDbContext> options)
            : base(options) { }

        // DbSet
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<ExerciseGoal> ExerciseGoals { get; set; }
        public DbSet<DayTemplate> DayTemplates { get; set; }
        public DbSet<DayTemplateExercise> DayTemplateExercises { get; set; }
        public DbSet<Equipment> Equipments { get; set; }
        public DbSet<ExerciseEquipment> ExerciseEquipments { get; set; }
        public DbSet<ExerciseGroupPct> ExerciseGroupPcts { get; set; }
        public DbSet<MuscleGroup> MuscleGroups { get; set; }
        public DbSet<Muscle> Muscles { get; set; }

        public DbSet<User> Users { get; set; }
        public DbSet<Food> Foods { get; set; }
        public DbSet<NutritionRecord> NutritionRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Exercise PK 是字串
            modelBuilder.Entity<Exercise>()
                .HasKey(e => e.ExKey);

            // ExerciseGoal -> Exercise (FK: ex_key)
            modelBuilder.Entity<ExerciseGoal>()
                .HasOne(g => g.Exercise)
                .WithMany(e => e.Goals)
                .HasForeignKey(g => g.ExKey);

            // ExerciseEquipment PK 是字串
            modelBuilder.Entity<ExerciseEquipment>()
                .HasKey(ee => ee.ExKey);

            // ExerciseEquipment -> Exercise
            modelBuilder.Entity<ExerciseEquipment>()
                .HasOne(ee => ee.Exercise)
                .WithOne(e => e.ExerciseEquipment)
                .HasForeignKey<ExerciseEquipment>(ee => ee.ExKey);

            // ExerciseEquipment -> Equipment
            modelBuilder.Entity<ExerciseEquipment>()
                .HasOne(ee => ee.Equipment)
                .WithMany(eq => eq.ExerciseEquipments)
                .HasForeignKey(ee => ee.EquipmentId);

            // ExerciseGroupPct 複合 PK
            modelBuilder.Entity<ExerciseGroupPct>()
                .HasKey(p => new { p.ExKey, p.GroupKey });

            // ExerciseGroupPct -> Exercise
            modelBuilder.Entity<ExerciseGroupPct>()
                .HasOne(p => p.Exercise)
                .WithMany(e => e.ExerciseGroupPcts)
                .HasForeignKey(p => p.ExKey);

            // ExerciseGroupPct -> MuscleGroup
            modelBuilder.Entity<ExerciseGroupPct>()
                .HasOne(p => p.MuscleGroup)
                .WithMany(m => m.ExerciseGroupPcts)
                .HasForeignKey(p => p.GroupKey);

            // Muscle -> MuscleGroup
            modelBuilder.Entity<Muscle>()
                .HasOne(m => m.MuscleGroup)
                .WithMany()
                .HasForeignKey(m => m.GroupKey);

            // DayTemplateExercise -> Exercise (FK: ex_key)
            modelBuilder.Entity<DayTemplateExercise>()
                .HasOne(dte => dte.Exercise)
                .WithMany()
                .HasForeignKey(dte => dte.ExKey);

            // DayTemplateExercise -> DayTemplate
            modelBuilder.Entity<DayTemplateExercise>()
                .HasOne(dte => dte.DayTemplate)
                .WithMany()
                .HasForeignKey(dte => dte.DayTemplateId);

            // NutritionRecord -> User
            modelBuilder.Entity<NutritionRecord>()
                .HasOne(r => r.User)
                .WithMany(u => u.NutritionRecords)
                .HasForeignKey(r => r.UserId);

            // NutritionRecord -> Food
            modelBuilder.Entity<NutritionRecord>()
                .HasOne(r => r.Food)
                .WithMany(f => f.NutritionRecords)
                .HasForeignKey(r => r.FoodId);
        }
    }
}