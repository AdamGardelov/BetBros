namespace BetBros.Server.Models;

// For displaying bet history with all related data
public class BetResult
{
    public Bet Bet { get; set; } = null!;
    public Game Game { get; set; } = null!;
    public User User { get; set; } = null!;
    public GameWeek GameWeek { get; set; } = null!;
}
