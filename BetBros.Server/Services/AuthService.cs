using System.Security.Claims;
using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server.ProtectedBrowserStorage;

namespace BetBros.Server.Services;

public class AuthService(
    IDataStore dataStore,
    AuthenticationStateProvider authStateProvider,
    ProtectedLocalStorage localStorage) : IAuthService
{
    private readonly CustomAuthenticationStateProvider _authStateProvider = (CustomAuthenticationStateProvider)authStateProvider;
    private int? _cachedUserId;

    public bool IsAuthenticated => _cachedUserId.HasValue;

    public async Task<User?> LoginAsync(string username, string password)
    {
        var user = dataStore.GetUserByUsername(username);

        if (user != null && PasswordHasher.VerifyPassword(password, user.PasswordHash))
        {
            // Store user ID in browser's protected local storage
            await localStorage.SetAsync("UserId", user.Id);
            _cachedUserId = user.Id;

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new("DisplayName", user.DisplayName)
            };

            if (user.IsAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            var identity = new ClaimsIdentity(claims, "BetBros");
            var principal = new ClaimsPrincipal(identity);

            _authStateProvider.SetAuthenticationState(principal);
            return user;
        }

        return null;
    }

    public async Task LogoutAsync()
    {
        await localStorage.DeleteAsync("UserId");
        _cachedUserId = null;
        _authStateProvider.Logout();
    }

    public async Task<User?> GetCurrentUserAsync()
    {
        // Try cache first
        if (_cachedUserId.HasValue)
        {
            return dataStore.GetUserById(_cachedUserId.Value);
        }

        // Try loading from localStorage
        try
        {
            var result = await localStorage.GetAsync<int>("UserId");
            if (result.Success)
            {
                _cachedUserId = result.Value;
                return dataStore.GetUserById(result.Value);
            }
        }
        catch
        {
            // localStorage might not be available yet
        }

        return null;
    }
}
