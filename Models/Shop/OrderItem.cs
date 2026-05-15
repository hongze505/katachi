// 訂單明細
namespace katachi.Models.Shop
{
    public class OrderItem
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public Order? Order { get; set; }

        public string ProductCode { get; set; } = string.Empty;

        public string ProductName { get; set; } = string.Empty;

        public string OptionText { get; set; } = string.Empty;

        public int UnitPrice { get; set; }

        public int Quantity { get; set; }

        public int Subtotal { get; set; }

        public string ImageUrl { get; set; } = string.Empty;
    }
}
