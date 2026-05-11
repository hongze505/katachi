namespace katachi.Models.Account
{
    public class AuthViewModel
    {
        public LoginViewModel Login { get; set; } = new();
        public RegisterViewModel Register { get; set; } = new();
        public string ActiveTab { get; set; } = "login"; // 控制顯示哪個 Tab
    }
}