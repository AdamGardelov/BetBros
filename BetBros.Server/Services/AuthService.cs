using System.Security.Claims;
using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;
using Microsoft.AspNetCore.Components.Authorization;

namespace BetBros.Server.Services;

public class AuthService(IDataStore dataStore, AuthenticationStateProvider authStateProvider) : IAuthService
{
    private readonly CustomAuthenticationStateProvider _authStateProvider = (CustomAuthenticationStateProvider)authStateProvider;
    private User? _currentUser;

    public bool IsAuthenticated => _currentUser != null;

    public async Task<User?> LoginAsync(string username, string password)
    {
        var user = dataStore.GetUserByUsername(username);

        if (user != null && PasswordHasher.VerifyPassword(password, user.PasswordHash))
        {
            _currentUser = user;

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new("DisplayName", user.DisplayName)
            };

            var identity = new ClaimsIdentity(claims, "BetBros");
            var principal = new ClaimsPrincipal(identity);

            _authStateProvider.SetAuthenticationState(principal);
            return user;
        }

        return null;
    }

    public async Task LogoutAsync()
    {
        _currentUser = null;
        _authStateProvider.Logout();
    }

    public async Task<User?> GetCurrentUserAsync()
    {
        return _currentUser;
    }
}
