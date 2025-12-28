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
    Bet? GetBetById(int betId);  // Get a specific bet by ID
    Dictionary<int, decimal> GetLeaderboard();  // UserId -> Total Profit
    Dictionary<int, UserStats> GetUserStats();
    Dictionary<int, FinancialStats> GetFinancialStats();  // UserId -> Financial Stats
    FinancialSummary GetFinancialSummary();  // Overall financial summary
}