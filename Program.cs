using Microsoft.EntityFrameworkCore;
using katachi.Models;

var builder = WebApplication.CreateBuilder(args);

// 加入 MVC
builder.Services.AddControllersWithViews();

// 加入 DbContext
builder.Services.AddDbContext<KatachiDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("KatachiDB")
    )
);

var app = builder.Build();

app.UseStaticFiles();
app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Plan}/{action=Index}/{id?}");

app.Run();