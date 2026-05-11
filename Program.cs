using katachi.Models;
using katachi.Models.Nutrition;
using katachi.Models.Program;
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
builder.Services.AddScoped<NutritionService>();
builder.Services.AddScoped<PlanService>();

var app = builder.Build();

app.UseStaticFiles();
app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();