using BetBros.Server.Components;
using BetBros.Server.Services;
using BetBros.Server.Services.Interfaces;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Add MudBlazor
builder.Services.AddMudServices();

// Add Database
var dbPath = "betbros.db";
// Check if running on Azure (HOME is set)
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME")))
{
    dbPath = "/home/betbros.db";
}
builder.Services.AddDbContext<BetBrosDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Add authentication and authorization
builder.Services.AddAuthentication("BetBros")
    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, BetBrosAuthenticationHandler>("BetBros", null);

builder.Services.AddCascadingAuthenticationState();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthenticationStateProvider>();
builder.Services.AddAuthorization();

// Register application services
builder.Services.AddScoped<IDataStore, SqliteDataStore>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGameWeekService, GameWeekService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IBetService, BetService>();

var app = builder.Build();

// Ensure Database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BetBrosDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();
app.MapStaticAssets();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
