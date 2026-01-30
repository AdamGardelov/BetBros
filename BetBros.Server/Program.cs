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
    dbPath = "/home/betbros.db";

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

// Add HTTP client factory for keep-alive service
builder.Services.AddHttpClient();

// Register keep-alive service to prevent Azure free tier from sleeping
builder.Services.AddHostedService<KeepAliveService>();

var app = builder.Build();

// Ensure Database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BetBrosDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    logger.LogInformation("Database path: {DbPath}", dbPath);
    logger.LogInformation("Database exists: {Exists}", File.Exists(dbPath));
    
    var pending = db.Database.GetPendingMigrations().ToList();
    logger.LogInformation("Pending migrations: {Count} - {Migrations}", 
        pending.Count, string.Join(", ", pending));

    try
    {
        db.Database.Migrate();
        logger.LogInformation("Migrations applied successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Migration failed: {Message}", ex.Message);
        throw; // Don't swallow this during debugging
    }
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

// Keep-alive endpoint to prevent Azure free tier from sleeping
app.MapGet("/keepalive", () => Results.Ok(new { status = "alive", timestamp = DateTime.UtcNow }))
    .AllowAnonymous();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
