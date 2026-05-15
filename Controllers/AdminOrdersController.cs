using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using katachi.Data;

namespace katachi.Controllers
{
    public class AdminOrdersController : Controller
    {
        private readonly ShopDbContext _context;

        public AdminOrdersController(ShopDbContext context)
        {
            _context = context;
        }

        // 顯示全部訂單
        public async Task<IActionResult> Index()
        {
            var orders = await _context.Orders
                .OrderByDescending(o => o.Id)
                .ToListAsync();

            return View(orders);
        }

        // 顯示單一訂單和它底下的商品明細
        public async Task<IActionResult> Details(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            return View(order);
        }


        // 接收要改哪一筆訂單，以及新狀態
        [HttpPost]
        public async Task<IActionResult> UpdateStatus(int id, string status)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            var oldStatus = order.Status;

            if (oldStatus == "已完成" && status == "已取消")
            {
                TempData["Error"] = "已完成的訂單不能取消，避免庫存被錯誤補回。";
                return RedirectToAction("Details", new { id });
            }

            // 如果從非取消狀態改成取消，就把庫存補回去
            if (oldStatus != "已取消" && status == "已取消")
            {
                await _context.Entry(order)
                    .Collection(o => o.Items)
                    .LoadAsync();

                foreach (var item in order.Items)
                {
                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.ProductCode == item.ProductCode);

                    if (product != null)
                    {
                        product.Stock += item.Quantity;
                    }
                }
            }

            // 如果從取消狀態改回非取消，就重新扣庫存
            if (oldStatus == "已取消" && status != "已取消")
            {
                await _context.Entry(order)
                    .Collection(o => o.Items)
                    .LoadAsync();

                foreach (var item in order.Items)
                {
                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.ProductCode == item.ProductCode);

                    if (product == null)
                    {
                        return BadRequest($"找不到商品：{item.ProductCode}");
                    }

                    if (product.Stock < item.Quantity)
                    {
                        return BadRequest($"{product.Name} 庫存不足，無法恢復訂單");
                    }

                    product.Stock -= item.Quantity;
                }
            }


            // 更新狀態
            order.Status = status;

            await _context.SaveChangesAsync();
            TempData["Success"] = "訂單狀態已更新。";


            // 改完回到同一張訂單明細頁
            return RedirectToAction("Details", new { id });
        }

    }
}

