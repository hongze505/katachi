using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using katachi.Data;
using katachi.Models.Shop;

namespace katachi.Controllers
{
    public class AdminProductsController : Controller
    {
        // 數據庫交互的上下文對象，允許我們查詢和保存數據
        private readonly ShopDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public AdminProductsController(ShopDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        public async Task<IActionResult> Index()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .OrderBy(p => p.Id)
                .ToListAsync();

            return View(products);
        }

        // 新增商品頁面
        public async Task<IActionResult> Create()
        {
            ViewBag.Categories = await _context.Categories
                .OrderBy(c => c.Id)
                .ToListAsync();

            return View();
        }

        // 打開編輯頁，把商品資料顯示出來
        public async Task<IActionResult> Edit(int id)
        {
            // 根據 id 從資料庫中查詢對應的商品
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            ViewBag.Categories = await _context.Categories
                .OrderBy(c => c.Id)
                .ToListAsync();

            return View(product);
        }

        //接收表單送出
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(Product product, IFormFile? imageFile)
        {
            ValidateProductImage(imageFile);

            if (!ModelState.IsValid)
            {
                ViewBag.Categories = await _context.Categories
                    .OrderBy(c => c.Id)
                    .ToListAsync();

                return View(product);
            }

            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            if (existingProduct == null)
            {
                return NotFound();
            }

            existingProduct.ProductCode = product.ProductCode;
            existingProduct.CategoryId = product.CategoryId;
            existingProduct.Name = product.Name;
            existingProduct.Subtitle = product.Subtitle;
            existingProduct.Description = product.Description;
            existingProduct.Price = product.Price;
            existingProduct.OriginalPrice = product.OriginalPrice;
            existingProduct.Stock = product.Stock;
            existingProduct.Rating = product.Rating;
            existingProduct.ImageUrl = await SaveProductImageAsync(imageFile) ?? product.ImageUrl;
            existingProduct.IsActive = product.IsActive;

            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Index));
        }



        // 接收表單送出
        [HttpPost]
        [ValidateAntiForgeryToken]
        // 把表單欄位自動變成一個 Product 物件
        public async Task<IActionResult> Create(Product product, IFormFile? imageFile)
        {
            ValidateProductImage(imageFile);

            if (!ModelState.IsValid)
            {
                ViewBag.Categories = await _context.Categories
                    .OrderBy(c => c.Id)
                    .ToListAsync();

                return View(product);
            }

            product.ImageUrl = await SaveProductImageAsync(imageFile) ?? product.ImageUrl;

            // 把新商品加入資料庫
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // 寫入 SQL Server
            return RedirectToAction(nameof(Index));
        }

        private async Task<string?> SaveProductImageAsync(IFormFile? imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return null;
            }

            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            var uploadFolder = Path.Combine(_environment.WebRootPath, "katachi-shop", "img", "uploads");
            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadFolder, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await imageFile.CopyToAsync(stream);

            return $"/katachi-shop/img/uploads/{fileName}";
        }

        private void ValidateProductImage(IFormFile? imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return;
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                ModelState.AddModelError("ImageUrl", "圖片只支援 jpg、jpeg、png、webp、gif。");
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            product.IsActive = !product.IsActive;

            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Index));
        }


    }
}

