namespace katachi.Models.Shop
{
    public class Category
    {
        public int Id { get; set; }

        public string Code { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public List<Product> Products { get; set; } = new();
    }
}


