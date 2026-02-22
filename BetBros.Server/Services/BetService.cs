using BetBros.Server.Enums;
using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;

namespace BetBros.Server.Services;

public class BetService(IDataStore dataStore) : IBetService
{
    private const decimal WeeklyStake = 200m;

    public Bet PlaceBet(int userId, int gameId, BetType prediction, int? predictedHomeScore = null, int? predictedAwayScore = null)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
            throw new InvalidOperationException("Game not found");

        // Validate prediction matches the game's bet kind category
        var is1X2Prediction = prediction is BetType.HomeWin or BetType.Draw or BetType.AwayWin;
        var isWinToNilPrediction = prediction is BetType.HomeWinToNil or BetType.AwayWinToNil;
        var isDnbPrediction = prediction is BetType.HomeWinDNB or BetType.AwayWinDNB;
        var isOverUnderPrediction = prediction is BetType.Over or BetType.Under;
        var isExactScorePrediction = prediction is BetType.ExactScore;
        var isAsianHandicapPrediction = prediction is BetType.HomeWinAH or BetType.AwayWinAH;
        var isHandicap3WayPrediction = prediction is BetType.HomeWinH3W or BetType.DrawH3W or BetType.AwayWinH3W;

        var is1X2Game = game.BetKind is BetType.HomeWin or BetType.Draw or BetType.AwayWin;
        var isOverUnderGame = game.BetKind == BetType.OverOrUnder;
        var isExactScoreGame = game.BetKind is BetType.ExactScore;
        var isAsianHandicapGame = game.BetKind is BetType.HomeWinAH or BetType.AwayWinAH;
        var isHandicap3WayGame = game.BetKind is BetType.HomeWinH3W or BetType.DrawH3W or BetType.AwayWinH3W;

        if ((is1X2Game && !is1X2Prediction && !isWinToNilPrediction && !isDnbPrediction) ||
            (isOverUnderGame && !isOverUnderPrediction) ||
            (isExactScoreGame && !isExactScorePrediction) ||
            (isAsianHandicapGame && !isAsianHandicapPrediction) ||
            (isHandicap3WayGame && !isHandicap3WayPrediction))
            throw new ArgumentException("Prediction type does not match game bet kind", nameof(prediction));
        
        // Validate exact score predictions
        if (isExactScorePrediction && (!predictedHomeScore.HasValue || !predictedAwayScore.HasValue))
            throw new ArgumentException("Exact score predictions require both home and away scores", nameof(prediction));

        // Check if a bet already exists - update it instead of creating new
        var weekGameCount = dataStore.GetGamesByWeek(game.GameWeekId).Count;
        var stakePerBet = weekGameCount > 0 ? WeeklyStake / weekGameCount : WeeklyStake;

        var existingBet = dataStore.GetBetByUserAndGame(userId, gameId);
        if (existingBet != null)
        {
            existingBet.Prediction = prediction;
            existingBet.Stake = stakePerBet;
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
            Stake = stakePerBet,
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
        var games = dataStore.GetGames().ToDictionary(g => g.Id);
        var users = dataStore.GetUsers().ToDictionary(u => u.Id);
        var gameWeeks = dataStore.GetGameWeeks().ToDictionary(gw => gw.Id);

        if (userId.HasValue)
            bets = bets.Where(b => b.UserId == userId.Value).ToList();

        var results = new List<BetResult>();

        foreach (var bet in bets)
        {
            if (!games.TryGetValue(bet.GameId, out var game)) continue;
            if (!users.TryGetValue(bet.UserId, out var user)) continue;
            if (!gameWeeks.TryGetValue(game.GameWeekId, out var gameWeek)) continue;

            if (gameWeekId.HasValue && gameWeek.Id != gameWeekId.Value) continue;

            results.Add(new BetResult
            {
                Bet = bet,
                Game = game,
                User = user,
                GameWeek = gameWeek
            });
        }

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

    public Bet? GetBetById(int betId)
    {
        return dataStore.GetBets().FirstOrDefault(b => b.Id == betId);
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
            var totalWins = scoredBets.Count(b => b.Status == BetStatus.Won || b.Status == BetStatus.Refunded);

            var accuracy = totalBets > 0 ? (decimal)totalWins / totalBets * 100 : 0;

            stats[user.Id] = new UserStats
            {
                TotalBets = totalBets,
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

        // Get all completed weeks (where all games are completed and net profit is set)
        var completedWeeks = gameWeeks.Where(gw =>
        {
            var weekGames = games.Where(g => g.GameWeekId == gw.Id).ToList();
            return weekGames.Count > 0 && weekGames.All(g => g.Status == GameStatus.Completed && g.HomeScore.HasValue) && gw.NetProfit.HasValue;
        }).ToList();

        // Calculate stats per user based on weeks where they were the selector
        foreach (var user in users)
        {
            // Get weeks where this user was the selector
            var userWeeks = completedWeeks.Where(w => w.GameSelectorId == user.Id).ToList();

            // Calculate financial stats
            // TotalBet: 200kr per week where user was selector
            var totalGamesPlayed = userWeeks.Sum(w => games.Count(g => g.GameWeekId == w.Id));
            var totalBet = userWeeks.Count * WeeklyStake;
            
            // NetProfit is the profit/loss amount entered by user
            // TotalWon: Only count positive weeks (just the profit amount, not bet + profit)
            var totalWon = userWeeks.Where(w => w.NetProfit.HasValue && w.NetProfit.Value > 0)
                .Sum(w => w.NetProfit!.Value);
            // TotalLost: Only count negative weeks (the amount lost)
            var totalLost = userWeeks.Where(w => w.NetProfit.HasValue && w.NetProfit.Value < 0)
                .Sum(w => Math.Abs(w.NetProfit!.Value));
            var netProfit = userWeeks.Where(w => w.NetProfit.HasValue).Sum(w => w.NetProfit!.Value);
            
            // If the absolute loss exceeds the calculated investment, it means the user invested more
            // than the standard 200kr/week (or weeks are not being counted correctly)
            // In that case, use the absolute value of NetProfit as the actual investment
            if (netProfit < 0 && Math.Abs(netProfit) > totalBet)
                totalBet = Math.Abs(netProfit);
            
            // ROI calculation: (Net Profit / Total Invested) * 100
            // NetProfit represents the net result (profit or loss)
            var roi = totalBet > 0 ? netProfit / totalBet * 100 : 0;
            
            // Cap ROI at -100% for losses (you can't lose more than you invested)
            if (roi < -100)
                roi = -100;

            stats[user.Id] = new FinancialStats
            {
                TotalBet = totalBet,
                TotalWon = totalWon,
                TotalLost = totalLost,
                NetProfit = netProfit,
                RoiPercent = roi,
                WeeksParticipated = userWeeks.Count,
                TotalGamesPlayed = totalGamesPlayed
            };
        }

        return stats;
    }

    public FinancialSummary GetFinancialSummary()
    {
        var financialStats = GetFinancialStats();
        var totalWon = financialStats.Values.Sum(s => s.TotalWon);
        var totalLost = financialStats.Values.Sum(s => s.TotalLost);
        // NetProfit is already calculated correctly in GetFinancialStats (sum of all NetProfit values)
        var netProfit = financialStats.Values.Sum(s => s.NetProfit);

        var gameWeeks = dataStore.GetGameWeeks();
        var games = dataStore.GetGames();
        // Count weeks where all games are completed
        var completedWeeks = gameWeeks.Where(gw =>
        {
            var weekGames = games.Where(g => g.GameWeekId == gw.Id).ToList();
            return weekGames.Count > 0 && weekGames.All(g => g.Status == GameStatus.Completed && g.HomeScore.HasValue);
        }).Count();

        // TotalBet should be 200kr per completed week (not summing per-user bets)
        var totalBet = completedWeeks * WeeklyStake;
        var roi = totalBet > 0 ? netProfit / totalBet * 100 : 0;

        return new FinancialSummary
        {
            TotalBet = totalBet,
            TotalWon = totalWon,
            TotalLost = totalLost,
            NetProfit = netProfit,
            RoiPercent = roi,
            TotalWeeks = completedWeeks,
            TotalBalance = totalBet + netProfit
        };
    }
}
