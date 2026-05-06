using Microsoft.AspNetCore.Mvc;

namespace katachi.Controllers
{
    public class HomeController : Controller
    {
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }
    }
}