namespace BetBros.Server.Models;

public class FinancialSummary
{
    public decimal TotalBet { get; set; }      // Sum of all bets
    public decimal TotalWon { get; set; }      // Sum of all winnings (only positive weeks)
    public decimal TotalLost { get; set; }     // Sum of all losses (only negative weeks)
    public decimal NetProfit { get; set; }     // Total won - total bet
    public decimal RoiPercent { get; set; }    // Overall ROI
    public int TotalWeeks { get; set; }        // Total number of weeks
}