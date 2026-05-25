using System.ComponentModel.DataAnnotations;

namespace katachi.Models.Account
{
    public class ForgotPasswordViewModel
    {
        [Required(ErrorMessage = "請輸入 Email")]
        [EmailAddress]
        public string Email { get; set; } = "";
    }

    public class ResetPasswordViewModel
    {
        public string Token { get; set; } = "";

        [Required(ErrorMessage = "請輸入新密碼")]
        [MinLength(6, ErrorMessage = "密碼至少 6 位")]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; } = "";

        [Required(ErrorMessage = "請確認密碼")]
        [Compare("NewPassword", ErrorMessage = "密碼不一致")]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = "";
    }
}