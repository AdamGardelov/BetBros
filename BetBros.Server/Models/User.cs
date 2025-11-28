namespace BetBros.Server.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int RotationOrder { get; set; }  // 0-3 for the 4 users
    public DateTime CreatedAt { get; set; }
}
