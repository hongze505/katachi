using Microsoft.AspNetCore.Mvc;

namespace katachi.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

