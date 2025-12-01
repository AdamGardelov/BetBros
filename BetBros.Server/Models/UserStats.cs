namespace BetBros.Server.Models;

public class UserStats
{
    public int TotalBets { get; set; }
    public int TotalWins { get; set; }
    public decimal AccuracyPercent { get; set; }
}