using System.Security.Claims;
using BetBros.Server.Services.Interfaces;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server.ProtectedBrowserStorage;

namespace BetBros.Server.Services;

public class CustomAuthenticationStateProvider(
    ProtectedLocalStorage localStorage,
    IServiceProvider serviceProvider) : AuthenticationStateProvider
{
    private ClaimsPrincipal _currentUser = new(new ClaimsIdentity());

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        try
        {
            // Try to restore user from protected local storage
            var result = await localStorage.GetAsync<int>("UserId");
            if (result.Success)
            {
                using var scope = serviceProvider.CreateScope();
                var dataStore = scope.ServiceProvider.GetRequiredService<IDataStore>();
                var user = dataStore.GetUserById(result.Value);

                if (user != null)
                {
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
                    _currentUser = new ClaimsPrincipal(identity);
                }
            }
        }
        catch
        {
            // localStorage might not be available during prerendering
        }

        return new AuthenticationState(_currentUser);
    }

    public void SetAuthenticationState(ClaimsPrincipal user)
    {
        _currentUser = user;
        NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(_currentUser)));
    }

    public void Logout()
    {
        _currentUser = new ClaimsPrincipal(new ClaimsIdentity());
        NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(_currentUser)));
    }
}
