namespace katachi.Models.Shop
{
    public class ProductOptionValue
    {
        public int Id { get; set; }

        public int ProductOptionId { get; set; }

        public ProductOption? ProductOption { get; set; }

        public string Text { get; set; } = string.Empty;

        public int? Price { get; set; }

        public int? OriginalPrice { get; set; }

        public string? ImageUrl { get; set; }

        public int SortOrder { get; set; }
    }
}
