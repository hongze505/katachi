using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using katachi.Models;
using katachi.Models.Nutrition;

namespace katachi.Controllers
{
    public class NutritionController : Controller
    {
        private readonly KatachiDbContext _db;
        private readonly NutritionService _nutritionService;

        public NutritionController(KatachiDbContext db, NutritionService nutritionService)
        {
            _db = db;
            _nutritionService = nutritionService;
        }

        // TDEE 頁面（Razor）
        public async Task<IActionResult> Tdee()
        {
            // 暫時先抓第一個使用者，之後換成登入的 user_id
            var user = await _db.Users.FirstOrDefaultAsync();
            if (user == null) return NotFound();

            var vm = _nutritionService.CalculateTdee(user);
            return View(vm);
        }

        // 飲食記錄頁面
        public IActionResult Index()
        {
            return View();
        }

        // 取得所有食物（JS fetch 用）
        [HttpGet]
        public async Task<IActionResult> GetFoods()
        {
            var foods = await _db.Foods
                .Select(f => new
                {
                    f.Id,
                    f.Name,
                    f.Calories,
                    f.Protein,
                    f.Carbs,
                    f.Fat,
                    f.Unit
                })
                .ToListAsync();

            return Json(foods);
        }

        // 取得某天的紀錄（JS fetch 用）
        [HttpGet]
        public async Task<IActionResult> GetRecords(int userId, DateOnly date)
        {
            var records = await _db.NutritionRecords
                .Include(r => r.Food)
                .Where(r => r.UserId == userId && r.RecordDate == date)
                .Select(r => new
                {
                    r.RecordId,
                    r.FoodId,
                    FoodName = r.Food.Name,
                    r.Grams,
                    Calories = r.Food.Calories * r.Grams / 100,
                    Protein = r.Food.Protein * r.Grams / 100,
                    Carbs = r.Food.Carbs * r.Grams / 100,
                    Fat = r.Food.Fat * r.Grams / 100,
                })
                .ToListAsync();

            return Json(records);
        }

        // 儲存當天紀錄（JS fetch 用）
        [HttpPost]
        public async Task<IActionResult> SaveRecords([FromBody] SaveRecordsRequest req)
        {
            // 先刪除當天舊的紀錄
            var existing = _db.NutritionRecords
                .Where(r => r.UserId == req.UserId && r.RecordDate == req.Date);
            _db.NutritionRecords.RemoveRange(existing);

            // 重新新增
            var newRecords = req.Items.Select(item => new katachi.Models.Entities.NutritionRecord
            {
                UserId = req.UserId,
                FoodId = item.FoodId,
                Grams = item.Grams,
                RecordDate = req.Date,
                CreatedAt = DateTime.Now
            });

            await _db.NutritionRecords.AddRangeAsync(newRecords);
            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }


        [HttpPost]
        public async Task<IActionResult> SaveProfile([FromBody] SaveProfileRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == 1); // 之後換成登入的 user_id
            if (user == null) return NotFound();

            user.Gender = req.Gender;
            user.Age = req.Age;
            user.HeightCm = req.HeightCm;
            user.WeightKg = req.WeightKg;
            user.Activity = req.Activity;
            user.ProfileUpdatedAt = DateTime.Now;

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        public class SaveProfileRequest
        {
            public string Gender { get; set; }
            public int Age { get; set; }
            public decimal HeightCm { get; set; }
            public decimal WeightKg { get; set; }
            public string Activity { get; set; }
        }

        // Request model
        public class SaveRecordsRequest
        {
            public int UserId { get; set; }
            public DateOnly Date { get; set; }
            public List<RecordItem> Items { get; set; }
        }

        public class RecordItem
        {
            public int FoodId { get; set; }
            public decimal Grams { get; set; }
        }
    }
}