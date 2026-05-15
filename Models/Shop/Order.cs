// 訂單主檔
namespace katachi.Models.Shop
{
    public class Order
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        // 會員登入後下單時，記錄這筆訂單屬於哪一位 users.user_id；未登入下單則為 null。
        public int? user_Id { get; set; }

        public string RecipientName { get; set; } = string.Empty;

        public string RecipientPhone { get; set; } = string.Empty;

        public string RecipientEmail { get; set; } = string.Empty;

        public string RecipientAddress { get; set; } = string.Empty;

        public int Subtotal { get; set; }

        public int Shipping { get; set; }

        public int MemberDiscount { get; set; }

        public int CouponDiscount { get; set; }

        public int Total { get; set; }

        public string Status { get; set; } = "待處理";
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<OrderItem> Items { get; set; } = new();
    }
}


