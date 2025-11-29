using BetBros.Server.Enums;
using BetBros.Server.Models;

namespace BetBros.Server.Services.Interfaces;

public interface IBetService
{
    Bet PlaceBet(int userId, int gameId, BetType prediction, int? predictedHomeScore = null, int? predictedAwayScore = null);
    List<Bet> GetUserBetsForWeek(int userId, int gameWeekId);
    List<BetResult> GetAllBetResults(int? userId = null, int? gameWeekId = null);
    void ScoreCompletedGames();  // Calculates points for completed games
    void ScoreGameBets(int gameId);  // Score all bets for a specific game (re-scores even if already scored)
    Dictionary<int, decimal> GetLeaderboard();  // UserId -> Total Profit
    Dictionary<int, UserStats> GetUserStats();
    Dictionary<int, FinancialStats> GetFinancialStats();  // UserId -> Financial Stats
    FinancialSummary GetFinancialSummary();  // Overall financial summary
}

public class UserStats
{
    public int TotalBets { get; set; }
    public int TotalPoints { get; set; }
    public int TotalWins { get; set; }
    public decimal AccuracyPercent { get; set; }
}

public class FinancialStats
{
    public decimal TotalBet { get; set; }      // Total amount bet (100kr per week)
    public decimal TotalWon { get; set; }      // Total winnings (only positive weeks)
    public decimal TotalLost { get; set; }      // Total losses (only negative weeks)
    public decimal NetProfit { get; set; }     // Won - Bet
    public decimal RoiPercent { get; set; }   // ROI percentage
    public int WeeksParticipated { get; set; } // Number of weeks they placed bets
}

public class FinancialSummary
{
    public decimal TotalBet { get; set; }      // Sum of all bets
    public decimal TotalWon { get; set; }      // Sum of all winnings (only positive weeks)
    public decimal TotalLost { get; set; }     // Sum of all losses (only negative weeks)
    public decimal NetProfit { get; set; }     // Total won - total bet
    public decimal RoiPercent { get; set; }    // Overall ROI
    public int TotalWeeks { get; set; }        // Total number of weeks
}
