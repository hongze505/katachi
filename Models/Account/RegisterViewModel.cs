using System.ComponentModel.DataAnnotations;

namespace katachi.Models.Account
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "請輸入名稱")]
        public string Name { get; set; } = "";

        [Required(ErrorMessage = "請輸入 Email")]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required(ErrorMessage = "請輸入帳號")]
        public string Username { get; set; } = "";

        [Required(ErrorMessage = "請輸入密碼")]
        [MinLength(6, ErrorMessage = "密碼至少 6 位")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = "";

        [Required(ErrorMessage = "請確認密碼")]
        [Compare("Password", ErrorMessage = "密碼不一致")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = "";
    }
}
