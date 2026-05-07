using Microsoft.AspNetCore.Mvc;

namespace katachi.Controllers
{
    public class NutritionController : Controller
    {
        public IActionResult NutritionIndex()
        {
            return View();
        }
    }
}
