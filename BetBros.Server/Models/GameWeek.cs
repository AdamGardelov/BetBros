namespace BetBros.Server.Models;

public class GameWeek
{
    public int Id { get; set; }
    public int WeekNumber { get; set; }       // Sequential week counter
    public DateTime StartDate { get; set; }   // Monday of the week (UTC)
    public DateTime EndDate { get; set; }     // Sunday of the week (UTC)
    public int GameSelectorId { get; set; }   // User who picks games this week
    public bool IsComplete { get; set; }      // All games completed and scored
    public decimal? NetProfit { get; set; }   // Total gain/loss for the week (positive = profit, negative = loss)
    public DateTime CreatedAt { get; set; }
}
