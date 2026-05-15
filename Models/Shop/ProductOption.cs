namespace katachi.Models.Shop
{
    public class ProductOption
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public Product? Product { get; set; }

        public string Name { get; set; } = string.Empty;

        public int SortOrder { get; set; }

        public List<ProductOptionValue> Values { get; set; } = new();
    }
}
