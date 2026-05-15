using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using katachi.Data;

namespace katachi.Controllers
{
    public class AdminProductOptionsController : Controller
    {
        //準備使用資料庫
        private readonly ShopDbContext _context;
        private readonly IWebHostEnvironment _environment;

        // 把資料庫物件丟進來
        public AdminProductOptionsController(ShopDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        public async Task<IActionResult> Index(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Options)
                    .ThenInclude(o => o.Values)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return NotFound();
            }

            return View(product);
        }

        //顯示新增選項類型頁
        public async Task<IActionResult> CreateOption(int productId)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return NotFound();
            }

            ViewBag.Product = product;

            return View();
        }

        [HttpPost]
        // 接收輸入的選項類型名稱
        public async Task<IActionResult> CreateOption(int productId, string name)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return NotFound();
            }

            var maxSortOrder = await _context.ProductOptions
                .Where(o => o.ProductId == productId)
                .MaxAsync(o => (int?)o.SortOrder) ?? 0;

            var option = new katachi.Models.Shop.ProductOption
            {
                ProductId = productId,
                Name = name,
                SortOrder = maxSortOrder + 1
            };

            _context.ProductOptions.Add(option);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { productId });
        }


        // 顯示新增畫面
        public async Task<IActionResult> CreateValue(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Options)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return NotFound();
            }

            ViewBag.Product = product;
            ViewBag.Options = product.Options.OrderBy(o => o.SortOrder).ToList();

            return View();
        }


        // 按下儲存後，把新資料寫進資料庫
        [HttpPost]
        public async Task<IActionResult> CreateValue(int productId, int optionId, string text, int? price, int? originalPrice, string? imageUrl, IFormFile? imageFile)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return NotFound();
            }

            var option = await _context.ProductOptions
                .FirstOrDefaultAsync(o => o.Id == optionId && o.ProductId == productId);

            if (option == null)
            {
                return NotFound();
            }

            var maxSortOrder = await _context.ProductOptionValues
                .Where(v => v.ProductOptionId == optionId)
                .MaxAsync(v => (int?)v.SortOrder) ?? 0;

            var value = new katachi.Models.Shop.ProductOptionValue
            {
                ProductOptionId = optionId,
                Text = text,
                Price = price,
                OriginalPrice = originalPrice,
                ImageUrl = await SaveOptionImageAsync(imageFile) ?? imageUrl,
                SortOrder = maxSortOrder + 1
            };

            _context.ProductOptionValues.Add(value);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { productId });

        }

        [HttpPost]
        public async Task<IActionResult> DeleteValue(int productId, int valueId)
        {
            var value = await _context.ProductOptionValues
                .FirstOrDefaultAsync(v => v.Id == valueId);

            if (value == null)
            {
                return NotFound();
            }

            _context.ProductOptionValues.Remove(value);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { productId });
        }

        [HttpPost]
        public async Task<IActionResult> DeleteOption(int productId, int optionId)
        {
            var option = await _context.ProductOptions
                // 刪除前先查這個選項類型底下有無選項值
                .Include(o => o.Values)
                .FirstOrDefaultAsync(o => o.Id == optionId && o.ProductId == productId);

            if (option == null)
            {
                return NotFound();
            }

            if (option.Values.Any())
            {
                return BadRequest("這個選項類型底下還有選項值，請先刪除選項值再刪除選項類型。");
            }

            _context.ProductOptions.Remove(option);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { productId });
        }

        public async Task<IActionResult> EditValue(int productId, int valueId)
        {
            var value = await _context.ProductOptionValues
                .Include(v => v.ProductOption)
                .FirstOrDefaultAsync(v => v.Id == valueId);

            if (value == null)
            {
                return NotFound();
            }

            ViewBag.ProductId = productId;

            return View(value);
        }

        [HttpPost]
        public async Task<IActionResult> EditValue(int productId, int valueId, string text, int? price, int? originalPrice, string? imageUrl, IFormFile? imageFile)
        {
            var value = await _context.ProductOptionValues
                .FirstOrDefaultAsync(v => v.Id == valueId);

            if (value == null)
            {
                return NotFound();
            }

            value.Text = text;
            value.Price = price;
            value.OriginalPrice = originalPrice;
            value.ImageUrl = await SaveOptionImageAsync(imageFile) ?? imageUrl;

            await _context.SaveChangesAsync();

            return RedirectToAction("Index", new { productId });
        }

        private async Task<string?> SaveOptionImageAsync(IFormFile? imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return null;
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return null;
            }

            var uploadFolder = Path.Combine(_environment.WebRootPath, "katachi-shop", "img", "uploads");
            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadFolder, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await imageFile.CopyToAsync(stream);

            return $"/katachi-shop/img/uploads/{fileName}";
        }

    }
}

