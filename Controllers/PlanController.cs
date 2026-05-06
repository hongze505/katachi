using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using katachi.Models;
using katachi.Models.Program;

namespace katachi.Controllers
{
    public class PlanController : Controller
    {
        private readonly KatachiDbContext _db;

        public PlanController(KatachiDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Generate([FromBody] GenerateRequest req)
        {
            if (req == null || req.Equipment == null || req.Equipment.Count == 0)
                return BadRequest("參數不完整");

            try
            {
                var service = new PlanService(_db);
                var result = service.Generate(req);

                return Json(new
                {
                    weekDays = result.WeekDays,
                    prescription = result.Prescription
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
