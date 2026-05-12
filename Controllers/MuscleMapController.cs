using Microsoft.AspNetCore.Mvc;

namespace WorkOutMvcBlank.Controllers
{
    public class MuscleMapController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Exercise()
        {
            return View();
        }
        public IActionResult Detail(string muscle, string equipment, string name)
        {
            return View();
        }
    }
}
