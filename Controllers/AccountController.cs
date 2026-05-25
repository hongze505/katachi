using katachi.Models;
using katachi.Models.Account;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

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
            foreach (var key in ModelState.Keys.Where(k => k.StartsWith("Register.")))
                ModelState.Remove(key);
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
            foreach (var key in ModelState.Keys.Where(k => k.StartsWith("Login.")))
                ModelState.Remove(key);
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

            TempData["Success"] = "註冊成功！請登入。";
            return RedirectToAction("Index", new { tab = "login" });
        }

        // POST — 登出
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Home");
        }

        // 密碼雜湊
        private static string HashPassword(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }

        // GET：忘記密碼頁
        public IActionResult ForgotPassword() => View();

        // POST：送出 Email
        [HttpPost]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel vm)
        {
            if (!ModelState.IsValid) return View(vm);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == vm.Email);
            if (user != null)
            {
                // 產生 token
                var token = Guid.NewGuid().ToString("N");
                user.PasswordResetToken = token;
                user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);
                await _db.SaveChangesAsync();

                // 寄信（先用 Console 模擬，之後換真實 SMTP）
                var resetLink = Url.Action("ResetPassword", "Account",
                    new { token }, Request.Scheme);
                Console.WriteLine($"[重設連結] {resetLink}"); // Debug 用，之後換寄信
            }

            // 不管有沒有找到 Email，都顯示同樣訊息（防止帳號枚舉）
            TempData["Info"] = "如果此 Email 存在，重設連結已寄出。";
            return RedirectToAction("ForgotPassword");
        }

        // GET：重設密碼頁
        public async Task<IActionResult> ResetPassword(string token)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token &&
                u.PasswordResetExpiry > DateTime.UtcNow);

            if (user == null)
            {
                TempData["Error"] = "連結無效或已過期。";
                return RedirectToAction("Index");
            }

            return View(new ResetPasswordViewModel { Token = token });
        }

        // POST：儲存新密碼
        [HttpPost]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel vm)
        {
            if (!ModelState.IsValid) return View(vm);

            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == vm.Token &&
                u.PasswordResetExpiry > DateTime.UtcNow);

            if (user == null)
            {
                TempData["Error"] = "連結無效或已過期。";
                return RedirectToAction("Index");
            }

            // 更新密碼（用你現有的 SHA256 雜湊方式）
            user.PasswordHash = HashPassword(vm.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetExpiry = null;
            await _db.SaveChangesAsync();

            TempData["Success"] = "密碼已重設，請重新登入。";
            return RedirectToAction("Index");
        }
    }
}