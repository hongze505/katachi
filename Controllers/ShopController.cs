using katachi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace katachi.Controllers
{
    public class ShopController : Controller
    {
        private readonly ShopDbContext _context;
        private readonly katachi.Models.KatachiDbContext _katachiContext;

        public ShopController(ShopDbContext context, katachi.Models.KatachiDbContext katachiContext)
        {
            _context = context;
            _katachiContext = katachiContext;
        }

        public IActionResult Index()
        {
            return View("fitness-shop");
        }

        public IActionResult ProductDetail()
        {
            return View("product-detail");
        }

        public IActionResult Checkout()
        {
            return View("checkout");
        }

        public IActionResult Login()
        {
            return RedirectToAction("Index", "Account");
        }

        public IActionResult Register()
        {
            return RedirectToAction("Index", "Account", new { tab = "register" });
        }

        public IActionResult OrderComplete()
        {
            return View("order-complete");
        }

        // 結帳頁自動帶入目前登入會員的基本資料。
        [HttpGet]
        public async Task<IActionResult> CurrentMember()
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return Unauthorized();
            }

            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdText, out var userId))
            {
                return Unauthorized();
            }

            var member = await _katachiContext.Users
                .AsNoTracking()
                .Where(user => user.UserId == userId)
                .Select(user => new
                {
                    name = user.Name,
                    email = user.Email
                })
                .FirstOrDefaultAsync();

            if (member == null)
            {
                return NotFound();
            }

            return Json(member);
        }

        // 會員訂單追蹤：只顯示目前登入會員自己的訂單。
        [Authorize]
        public async Task<IActionResult> MyOrders()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdText, out var userId))
            {
                return RedirectToAction("Index", "Account", new { returnUrl = Url.Action("MyOrders", "Shop") });
            }

            var orders = await _context.Orders
                .Include(order => order.Items)
                .Where(order => order.user_Id == userId)
                .OrderByDescending(order => order.CreatedAt)
                .ToListAsync();

            return View("my-orders", orders);
        }
    }
}
