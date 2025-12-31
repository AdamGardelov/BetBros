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

    try
    {
        db.Database.Migrate();
    }
    catch (Microsoft.Data.Sqlite.SqliteException ex) when (ex.Message.Contains("already exists"))
    {
        // Database exists but was created with EnsureCreated() (no migration history)
        // This can happen when upgrading from EnsureCreated to Migrate
        logger.LogWarning("Database tables already exist. Attempting to apply pending migrations manually...");

        try
        {
            // Manually add missing columns if they don't exist
            var connection = db.Database.GetDbConnection();
            connection.Open();

            using (var command = connection.CreateCommand())
            {
                // Check if AsianHandicapLine column exists
                command.CommandText = "PRAGMA table_info(Games)";
                using (var reader = command.ExecuteReader())
                {
                    bool hasAsianHandicap = false;
                    bool hasHandicap3Way = false;

                    while (reader.Read())
                    {
                        var columnName = reader.GetString(1);
                        if (columnName == "AsianHandicapLine") hasAsianHandicap = true;
                        if (columnName == "Handicap3WayLine") hasHandicap3Way = true;
                    }

                    reader.Close();

                    // Add missing columns
                    if (!hasAsianHandicap)
                    {
                        command.CommandText = "ALTER TABLE Games ADD COLUMN AsianHandicapLine TEXT NULL";
                        command.ExecuteNonQuery();
                        logger.LogInformation("Added AsianHandicapLine column to Games table");
                    }

                    if (!hasHandicap3Way)
                    {
                        command.CommandText = "ALTER TABLE Games ADD COLUMN Handicap3WayLine TEXT NULL";
                        command.ExecuteNonQuery();
                        logger.LogInformation("Added Handicap3WayLine column to Games table");
                    }
                }
            }

            connection.Close();
            logger.LogInformation("Successfully applied pending schema changes");
        }
        catch (Exception updateEx)
        {
            logger.LogError(updateEx, "Failed to apply schema updates. Manual intervention may be required.");
        }
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
