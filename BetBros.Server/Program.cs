using BetBros.Server.Components;
using BetBros.Server.Services;
using BetBros.Server.Services.Interfaces;
using Microsoft.AspNetCore.Components.Authorization;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Add MudBlazor
builder.Services.AddMudServices();

// Add authentication and authorization
builder.Services.AddAuthentication("BetBros")
    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, BetBrosAuthenticationHandler>("BetBros", null);

builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthenticationStateProvider>();
builder.Services.AddAuthorization();

// Register application services
builder.Services.AddSingleton<IDataStore, InMemoryDataStore>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGameWeekService, GameWeekService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IBetService, BetService>();

var app = builder.Build();

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
