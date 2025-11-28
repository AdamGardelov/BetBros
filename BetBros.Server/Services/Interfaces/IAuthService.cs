using BetBros.Server.Models;

namespace BetBros.Server.Services.Interfaces;

public interface IAuthService
{
    Task<User?> LoginAsync(string username, string password);
    Task LogoutAsync();
    Task<User?> GetCurrentUserAsync();
    bool IsAuthenticated { get; }
}
