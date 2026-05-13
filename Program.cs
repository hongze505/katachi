using katachi.Models;
using katachi.Models.Nutrition;
using katachi.Models.Program;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 加入 MVC
builder.Services.AddControllersWithViews();

// 加入 DbContext
builder.Services.AddDbContext<KatachiDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("KatachiDB")
    )
);
builder.Services.AddSingleton<katachi.Helpers.DbHelper>();
builder.Services.AddScoped<NutritionService>();
builder.Services.AddScoped<PlanService>();
// 加在 builder.Services 區塊
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Index";
        options.LogoutPath = "/Account/Logout";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
    });

builder.Services.AddAuthorization();

var app = builder.Build();


app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();  // ← 要在 UseAuthorization 前面
app.UseAuthorization();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();