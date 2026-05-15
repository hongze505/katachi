namespace katachi.Models.Shop
{
    public class Product
    {
        public int Id { get; set; }

        public string ProductCode { get; set; } = string.Empty;

        public int CategoryId { get; set; }

        public Category? Category { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Subtitle { get; set; }

        public string? Description { get; set; }

        public int Price { get; set; }

        public int? OriginalPrice { get; set; }
        public int Stock { get; set; }

        public decimal? Rating { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public List<ProductOption> Options { get; set; } = new();

    }
}
