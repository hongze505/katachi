using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using katachi.Data;
using katachi.Models.Shop;
using System.Security.Claims;

//前台結帳頁送出訂單
namespace katachi.Controllers
{
    [Route("api/shop/orders")]
    [ApiController]
    public class ShopOrderApiController : ControllerBase
    {
        private readonly ShopDbContext _context;

        public ShopOrderApiController(ShopDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest("購物車沒有商品");
            }

            var productCodes = request.Items
                .Where(item => !item.Id.StartsWith("bundle-", StringComparison.OrdinalIgnoreCase))
                .Select(item => item.Id)
                .Distinct()
                .ToList();

            var products = await _context.Products
                .Where(product => productCodes.Contains(product.ProductCode))
                .ToDictionaryAsync(product => product.ProductCode);

            foreach (var item in request.Items.Where(item => !item.Id.StartsWith("bundle-", StringComparison.OrdinalIgnoreCase)))
            {
                if (!products.TryGetValue(item.Id, out var product))
                {
                    return BadRequest($"找不到商品：{item.Id}");
                }

                if (product.Stock < item.Qty)
                {
                    return BadRequest($"{product.Name} 庫存不足");
                }

                product.Stock -= item.Qty;
            }

            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? userId = int.TryParse(userIdText, out var parsedUserId) ? parsedUserId : null;

            var order = new Order
            {
                OrderNumber = "K" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                user_Id = userId,
                Status = "待處理",
                RecipientName = request.Recipient.Name,
                RecipientPhone = request.Recipient.Phone,
                RecipientEmail = request.Recipient.Email,
                RecipientAddress = request.Recipient.Address,
                Subtotal = request.Subtotal,
                Shipping = request.Shipping,
                MemberDiscount = request.MemberDiscount,
                CouponDiscount = request.CouponDiscount,
                Total = request.Total,
                CreatedAt = DateTime.Now,
                Items = request.Items.Select(item => new OrderItem
                {
                    ProductCode = item.Id,
                    ProductName = item.Name,
                    OptionText = item.Subtitle ?? string.Empty,
                    UnitPrice = item.Price,
                    Quantity = item.Qty,
                    Subtotal = item.Price * item.Qty,
                    ImageUrl = item.Image ?? string.Empty
                }).ToList()
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                orderId = order.Id,
                orderNumber = order.OrderNumber
            });
        }
    }

    public class CreateOrderRequest
    {
        public List<CreateOrderItemRequest> Items { get; set; } = new();

        public CreateOrderRecipientRequest Recipient { get; set; } = new();

        public int Subtotal { get; set; }

        public int Shipping { get; set; }

        public int MemberDiscount { get; set; }

        public int CouponDiscount { get; set; }

        public int Total { get; set; }
    }

    public class CreateOrderItemRequest
    {
        public string Id { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Subtitle { get; set; } = string.Empty;

        public int Price { get; set; }

        public int Qty { get; set; }

        public string Image { get; set; } = string.Empty;
    }

    public class CreateOrderRecipientRequest
    {
        public string Name { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }
}



