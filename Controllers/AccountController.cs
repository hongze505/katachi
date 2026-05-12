using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using katachi.Models;
using katachi.Models.Account;

namespace katachi.Controllers
{
    public class AccountController : Controller
    {
        private readonly KatachiDbContext _db;

        public AccountController(KatachiDbContext db)
        {
            _db = db;
        }

        // GET — 顯示頁面
        public IActionResult Index(string tab = "login")
        {
            return View(new AuthViewModel { ActiveTab = tab });
        }

        // POST — 登入
        [HttpPost]
        public async Task<IActionResult> Login(AuthViewModel vm, string? returnUrl)
        {
            if (!ModelState.IsValid)
            {
                vm.ActiveTab = "login";
                return View("Index", vm);
            }

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == vm.Login.Email);

            if (user == null || user.PasswordHash != HashPassword(vm.Login.Password))
            {
                ModelState.AddModelError("", "Email 或密碼錯誤");
                vm.ActiveTab = "login";
                return View("Index", vm);
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = vm.Login.RememberMe,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
                }
            );

            return RedirectToAction("Index", "Home");
        }

        // POST — 註冊
        [HttpPost]
        public async Task<IActionResult> Register(AuthViewModel vm)
        {
            if (!ModelState.IsValid)
            {
                vm.ActiveTab = "register";
                return View("Index", vm);
            }

            if (await _db.Users.AnyAsync(u => u.Email == vm.Register.Email))
            {
                ModelState.AddModelError("Register.Email", "此 Email 已被註冊");
                vm.ActiveTab = "register";
                return View("Index", vm);
            }

            var user = new katachi.Models.Entities.User
            {
                Name = vm.Register.Name,
                Email = vm.Register.Email,
                Username = vm.Register.Username,
                PasswordHash = HashPassword(vm.Register.Password),
                CreatedAt = DateTime.Now
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return RedirectToAction("Index", new { tab = "login" });
        }

        // POST — 登出
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index");
        }

        // 密碼雜湊
        private static string HashPassword(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}