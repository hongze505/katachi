using System.ComponentModel.DataAnnotations;

namespace katachi.Models.Account
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "請輸入 Email")]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required(ErrorMessage = "請輸入密碼")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = "";

        public bool RememberMe { get; set; }
    }
}