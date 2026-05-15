using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using katachi.Data;

namespace katachi.Controllers
{
    [Route("api/shop")]
    [ApiController]
    public class ShopApiController : ControllerBase
    {
        private readonly ShopDbContext _context;

        public ShopApiController(ShopDbContext context)
        {
            _context = context;
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _context.Products
     .Include(p => p.Category)
     .Include(p => p.Options)
         .ThenInclude(o => o.Values)
                 .Where(p => p.IsActive)
                .Select(p => new
                {
                    id = p.ProductCode,
                    category = p.Category != null ? p.Category.Code : "",
                    categoryLabel = p.Category != null ? p.Category.Name : "",
                    name = p.Name,
                    subtitle = p.Subtitle,
                    description = p.Description,
                    price = p.Price,
                    originalPrice = p.OriginalPrice,
                    stock = p.Stock,
                    rating = p.Rating,
                    image = p.ImageUrl,
                    options = p.Options
    .OrderBy(o => o.SortOrder)
    .Select(o => new
    {
        label = o.Name,
        values = o.Values
            .OrderBy(v => v.SortOrder)
            .Select(v => new
            {
                text = v.Text,
                price = v.Price,
                originalPrice = v.OriginalPrice,
                image = v.ImageUrl
            })
            .ToList()
    })
    .ToList()

                })
                .ToListAsync();

            return Ok(products);
        }
    }
}

