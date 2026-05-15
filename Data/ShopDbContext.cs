using Microsoft.EntityFrameworkCore;
using katachi.Models.Shop;
namespace katachi.Data
{
    public class ShopDbContext : DbContext
    {
        public ShopDbContext(DbContextOptions<ShopDbContext> options)
            : base(options)
        {
        }

        public DbSet<Category> Categories { get; set; }

        public DbSet<Product> Products { get; set; }

        public DbSet<ProductOption> ProductOptions { get; set; }

        public DbSet<ProductOptionValue> ProductOptionValues { get; set; }

        public DbSet<Order> Orders { get; set; }

        public DbSet<OrderItem> OrderItems { get; set; }


    }
}

