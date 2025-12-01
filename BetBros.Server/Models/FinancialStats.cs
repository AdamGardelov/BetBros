namespace BetBros.Server.Models;

public class FinancialStats
{
    public decimal TotalBet { get; set; }      // Total amount bet (100kr per week)
    public decimal TotalWon { get; set; }      // Total winnings (only positive weeks)
    public decimal TotalLost { get; set; }      // Total losses (only negative weeks)
    public decimal NetProfit { get; set; }     // Won - Bet
    public decimal RoiPercent { get; set; }   // ROI percentage
    public int WeeksParticipated { get; set; } // Number of weeks they placed bets
}