using BetBros.Server.Enums;
using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;

namespace BetBros.Server.Services;

public class BetService(IDataStore dataStore) : IBetService
{
    private const decimal StakePerBet = 100m / 3m; // 33.33kr per bet

    public Bet PlaceBet(int userId, int gameId, BetType prediction, int? predictedHomeScore = null, int? predictedAwayScore = null)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        // Validate prediction matches the game's bet kind category
        var is1X2Prediction = prediction is BetType.HomeWin or BetType.Draw or BetType.AwayWin;
        var isWinToNilPrediction = prediction is BetType.HomeWinToNil or BetType.AwayWinToNil;
        var isOverUnderPrediction = prediction is BetType.Over or BetType.Under;
        var isExactScorePrediction = prediction is BetType.ExactScore;
        var is1X2Game = game.BetKind is BetType.HomeWin or BetType.Draw or BetType.AwayWin;
        var isOverUnderGame = game.BetKind == BetType.OverOrUnder;
        var isExactScoreGame = game.BetKind is BetType.ExactScore;

        if ((is1X2Game && !is1X2Prediction && !isWinToNilPrediction) || (isOverUnderGame && !isOverUnderPrediction) || (isExactScoreGame && !isExactScorePrediction))
        {
            throw new ArgumentException("Prediction type does not match game bet kind", nameof(prediction));
        }

        // Validate exact score predictions
        if (isExactScorePrediction && (!predictedHomeScore.HasValue || !predictedAwayScore.HasValue))
        {
            throw new ArgumentException("Exact score predictions require both home and away scores", nameof(prediction));
        }

        // Check if a bet already exists - update it instead of creating new
        var existingBet = dataStore.GetBetByUserAndGame(userId, gameId);
        if (existingBet != null)
        {
            existingBet.Prediction = prediction;
            existingBet.Stake = StakePerBet;
            existingBet.PredictedHomeScore = predictedHomeScore;
            existingBet.PredictedAwayScore = predictedAwayScore;
            existingBet.PlacedAt = DateTime.UtcNow;
            // Reset scoring since prediction changed
            existingBet.Status = BetStatus.Pending;
            existingBet.Payout = null;
            existingBet.Profit = null;
            existingBet.ScoredAt = null;
            return dataStore.UpdateBet(existingBet);
        }

        var bet = new Bet
        {
            GameId = gameId,
            UserId = userId,
            Prediction = prediction,
            Stake = StakePerBet,
            PredictedHomeScore = predictedHomeScore,
            PredictedAwayScore = predictedAwayScore,
            Status = BetStatus.Pending,
            PlacedAt = DateTime.UtcNow
        };

        return dataStore.CreateBet(bet);
    }

    public List<Bet> GetUserBetsForWeek(int userId, int gameWeekId)
    {
        var games = dataStore.GetGamesByWeek(gameWeekId);
        var gameIds = games.Select(g => g.Id).ToList();
        var userBets = dataStore.GetBetsByUser(userId);

        return userBets.Where(b => gameIds.Contains(b.GameId)).ToList();
    }

    public List<BetResult> GetAllBetResults(int? userId = null, int? gameWeekId = null)
    {
        var bets = dataStore.GetBets();
        var games = dataStore.GetGames();
        var users = dataStore.GetUsers();
        var gameWeeks = dataStore.GetGameWeeks();

        if (userId.HasValue)
        {
            bets = bets.Where(b => b.UserId == userId.Value).ToList();
        }

        if (gameWeekId.HasValue)
        {
            var gameIds = games.Where(g => g.GameWeekId == gameWeekId.Value).Select(g => g.Id).ToList();
            bets = bets.Where(b => gameIds.Contains(b.GameId)).ToList();
        }

        var results = bets.Select(bet =>
        {
            var game = games.First(g => g.Id == bet.GameId);
            var user = users.First(u => u.Id == bet.UserId);
            var gameWeek = gameWeeks.First(gw => gw.Id == game.GameWeekId);

            return new BetResult
            {
                Bet = bet,
                Game = game,
                User = user,
                GameWeek = gameWeek
            };
        }).ToList();

        return results.OrderByDescending(r => r.Game.CreatedAt).ToList();
    }

    public void ScoreCompletedGames()
    {
        var games = dataStore.GetGames().Where(g => g.Status == GameStatus.Completed).ToList();
        var bets = dataStore.GetBets();

        foreach (var game in games)
        {
            var gameBets = bets.Where(b => b.GameId == game.Id && !b.ScoredAt.HasValue).ToList();

            foreach (var bet in gameBets)
            {
                var (status, payout, profit) = ScoringEngine.ScoreBet(bet, game);

                bet.Status = status;
                bet.Payout = payout;
                bet.Profit = profit;
                bet.ScoredAt = DateTime.UtcNow;

                dataStore.UpdateBet(bet);
            }
        }
    }

    public void ScoreGameBets(int gameId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null || game.Status != GameStatus.Completed || !game.HomeScore.HasValue || !game.AwayScore.HasValue)
            return;

        var gameBets = dataStore.GetBetsByGame(gameId);

        // Re-score all bets for this game (including already scored ones, in case results were updated)
        foreach (var bet in gameBets)
        {
            var (status, payout, profit) = ScoringEngine.ScoreBet(bet, game);

            bet.Status = status;
            bet.Payout = payout;
            bet.Profit = profit;
            bet.ScoredAt = DateTime.UtcNow; // Update timestamp even if already scored

            dataStore.UpdateBet(bet);
        }
    }

    public Dictionary<int, decimal> GetLeaderboard()
    {
        // Use financial stats (NetProfit from weeks) instead of bet.Profit
        var financialStats = GetFinancialStats();
        return financialStats.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.NetProfit
        ).OrderByDescending(kvp => kvp.Value)
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
    }

    public Dictionary<int, UserStats> GetUserStats()
    {
        var bets = dataStore.GetBets();
        var users = dataStore.GetUsers();
        var stats = new Dictionary<int, UserStats>();

        foreach (var user in users)
        {
            var userBets = bets.Where(b => b.UserId == user.Id).ToList();
            var scoredBets = userBets.Where(b => b.ScoredAt.HasValue).ToList();

            var totalBets = scoredBets.Count;
            var totalWins = scoredBets.Count(b => b.Status == BetStatus.Won);

            var accuracy = totalBets > 0 ? (decimal)totalWins / totalBets * 100 : 0;

            stats[user.Id] = new UserStats
            {
                TotalBets = totalBets,
                TotalPoints = 0, // Points system deprecated
                TotalWins = totalWins,
                AccuracyPercent = accuracy
            };
        }

        return stats;
    }

    public Dictionary<int, FinancialStats> GetFinancialStats()
    {
        var games = dataStore.GetGames();
        var gameWeeks = dataStore.GetGameWeeks();
        var users = dataStore.GetUsers();
        var stats = new Dictionary<int, FinancialStats>();

        // Get all completed weeks (where all 3 games are completed and net profit is set)
        var completedWeeks = gameWeeks.Where(gw =>
        {
            var weekGames = games.Where(g => g.GameWeekId == gw.Id && g.Status == GameStatus.Completed && g.HomeScore.HasValue).ToList();
            return weekGames.Count == 3 && gw.NetProfit.HasValue;
        }).ToList();

        // Calculate stats per user based on weeks where they were the selector
        foreach (var user in users)
        {
            // Get weeks where this user was the selector
            var userWeeks = completedWeeks.Where(w => w.GameSelectorId == user.Id).ToList();

            // Calculate financial stats
            var totalBet = userWeeks.Count * 100m; // 100kr per week
            // NetProfit is the profit/loss amount entered by user
            // TotalWon: Only count positive weeks (just the profit amount, not bet + profit)
            var totalWon = userWeeks.Where(w => w.NetProfit.HasValue && w.NetProfit.Value > 0)
                .Sum(w => w.NetProfit!.Value);
            // TotalLost: Only count negative weeks (the amount lost)
            var totalLost = userWeeks.Where(w => w.NetProfit.HasValue && w.NetProfit.Value < 0)
                .Sum(w => Math.Abs(w.NetProfit!.Value));
            var netProfit = userWeeks.Where(w => w.NetProfit.HasValue).Sum(w => w.NetProfit!.Value);
            var roi = totalBet > 0 ? (netProfit / totalBet) * 100 : 0;

            stats[user.Id] = new FinancialStats
            {
                TotalBet = totalBet,
                TotalWon = totalWon,
                TotalLost = totalLost,
                NetProfit = netProfit,
                RoiPercent = roi,
                WeeksParticipated = userWeeks.Count
            };
        }

        return stats;
    }

    public FinancialSummary GetFinancialSummary()
    {
        var financialStats = GetFinancialStats();
        var totalBet = financialStats.Values.Sum(s => s.TotalBet);
        var totalWon = financialStats.Values.Sum(s => s.TotalWon);
        var totalLost = financialStats.Values.Sum(s => s.TotalLost);
        // NetProfit is already calculated correctly in GetFinancialStats (sum of all NetProfit values)
        var netProfit = financialStats.Values.Sum(s => s.NetProfit);
        var roi = totalBet > 0 ? (netProfit / totalBet) * 100 : 0;

        var gameWeeks = dataStore.GetGameWeeks();
        var games = dataStore.GetGames();
        // Count weeks where all 3 games are completed
        var completedWeeks = gameWeeks.Where(gw =>
        {
            var weekGames = games.Where(g => g.GameWeekId == gw.Id).ToList();
            return weekGames.Count == 3 && weekGames.All(g => g.Status == GameStatus.Completed && g.HomeScore.HasValue);
        }).Count();

        return new FinancialSummary
        {
            TotalBet = totalBet,
            TotalWon = totalWon,
            TotalLost = totalLost,
            NetProfit = netProfit,
            RoiPercent = roi,
            TotalWeeks = completedWeeks
        };
    }
}
