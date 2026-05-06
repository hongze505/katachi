using Microsoft.AspNetCore.Mvc;

namespace katachi.Controllers
{
    public class ProgramController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
