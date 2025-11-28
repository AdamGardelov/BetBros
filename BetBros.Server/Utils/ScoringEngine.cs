using BetBros.Server.Enums;
using BetBros.Server.Models;

namespace BetBros.Server.Utils;

public static class ScoringEngine
{
    public static (BetStatus status, decimal? payout, decimal? profit) ScoreBet(Bet bet, Game game)
    {
        if (game.Status != GameStatus.Completed || !game.HomeScore.HasValue || !game.AwayScore.HasValue)
            return (BetStatus.Pending, null, null);

        // Need odds and stake to calculate payout
        if (!bet.Odds.HasValue || bet.Stake == 0)
            return (BetStatus.Pending, null, null);

        var odds = bet.Odds.Value;
        var stake = bet.Stake;
        BetStatus status;
        decimal payout;
        decimal profit;

        // Handle exact score predictions
        if (bet.Prediction == BetType.ExactScore)
        {
            if (!bet.PredictedHomeScore.HasValue || !bet.PredictedAwayScore.HasValue)
                return (BetStatus.Pending, null, null);

            var isExactMatch = bet.PredictedHomeScore == game.HomeScore &&
                              bet.PredictedAwayScore == game.AwayScore;
            status = isExactMatch ? BetStatus.Won : BetStatus.Lost;
            payout = status == BetStatus.Won ? stake * odds : 0;
            profit = payout - stake;

            return (status, payout, profit);
        }

        // Handle win-to-nil bets
        if (bet.Prediction == BetType.HomeWinToNil)
        {
            var isWinToNil = game.HomeScore > game.AwayScore && game.AwayScore == 0;
            status = isWinToNil ? BetStatus.Won : BetStatus.Lost;
            payout = status == BetStatus.Won ? stake * odds : 0;
            profit = payout - stake;
            return (status, payout, profit);
        }

        if (bet.Prediction == BetType.AwayWinToNil)
        {
            var isWinToNil = game.AwayScore > game.HomeScore && game.HomeScore == 0;
            status = isWinToNil ? BetStatus.Won : BetStatus.Lost;
            payout = status == BetStatus.Won ? stake * odds : 0;
            profit = payout - stake;
            return (status, payout, profit);
        }

        // Handle other bet types (1/X/2, Over/Under)
        if (!game.ActualResult.HasValue)
            return (BetStatus.Pending, null, null);

        status = bet.Prediction == game.ActualResult ? BetStatus.Won : BetStatus.Lost;
        payout = status == BetStatus.Won ? stake * odds : 0;
        profit = payout - stake;

        return (status, payout, profit);
    }
}
