using Microsoft.EntityFrameworkCore;
using katachi.Models.Entities;

namespace katachi.Models.Program
{
    public class PlanService
    {
        private readonly KatachiDbContext _db;

        public PlanService(KatachiDbContext db)
        {
            _db = db;
        }

        public PlanResult Generate(GenerateRequest req)
        {
            var result = new PlanResult
            {
                WeekDays = new List<DayPlan>(),
                Prescription = GetPrescription(req.Goal)
            };

            // Step 1: 查 day_templates
            var templates = _db.DayTemplates
                .Where(t => t.TotalDays == req.Days)
                .OrderBy(t => t.DayNumber)
                .ToList();

            // Step 2: 迴圈每一天
            foreach (var template in templates)
            {
                // Step 3: 透過 day_template_exercises JOIN exercises JOIN exercise_goals
                var exercises = _db.DayTemplateExercises
                    .Include(dte => dte.Exercise)
                        .ThenInclude(e => e.Goals)
                    .Where(dte =>
                        dte.DayTemplateId == template.Id &&
                        req.Equipment.Contains(dte.Exercise.Equipment) &&
                        dte.Exercise.Goals.Any(g => g.Goal == req.Goal)
                    )
                    .OrderBy(dte => dte.SortOrder)
                    .Select(dte => new ExerciseItem
                    {
                        Name = dte.Exercise.Name,
                        MuscleGroup = dte.Exercise.MuscleGroup,
                        Equipment = dte.Exercise.Equipment,
                        Sets = dte.Exercise.Goals
                                        .First(g => g.Goal == req.Goal).Sets,
                        Reps = dte.Exercise.Goals
                                        .First(g => g.Goal == req.Goal).Reps,
                        RestSeconds = dte.Exercise.Goals
                                        .First(g => g.Goal == req.Goal).RestSeconds
                    })
                    .ToList();

                result.WeekDays.Add(new DayPlan
                {
                    DayNumber = template.DayNumber,
                    DayName = template.DayName,
                    Exercises = exercises
                });
            }

            return result;
        }

        private Prescription GetPrescription(string goal)
        {
            return goal switch
            {
                "hypertrophy" => new Prescription { Sets = 4, Reps = "8–12", Rest = "60–90 秒" },
                "strength" => new Prescription { Sets = 5, Reps = "3–5", Rest = "3–5 分鐘" },
                "fatloss" => new Prescription { Sets = 3, Reps = "15–20", Rest = "30–45 秒" },
                _ => new Prescription { Sets = 4, Reps = "8–12", Rest = "60–90 秒" }
            };
        }
    }
}
