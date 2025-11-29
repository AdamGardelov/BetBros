using BetBros.Server.Enums;
using BetBros.Server.Models;

namespace BetBros.Server.Utils;

public static class ScoringEngine
{
    public static (BetStatus status, decimal? payout, decimal? profit) ScoreBet(Bet bet, Game game)
    {
        if (game.Status != GameStatus.Completed || !game.HomeScore.HasValue || !game.AwayScore.HasValue)
            return (BetStatus.Pending, null, null);

        BetStatus status;

        // Handle exact score predictions
        if (bet.Prediction == BetType.ExactScore)
        {
            if (!bet.PredictedHomeScore.HasValue || !bet.PredictedAwayScore.HasValue)
                return (BetStatus.Pending, null, null);

            var isExactMatch = bet.PredictedHomeScore == game.HomeScore &&
                              bet.PredictedAwayScore == game.AwayScore;
            status = isExactMatch ? BetStatus.Won : BetStatus.Lost;

            return (status, null, null);
        }

        // Handle win-to-nil bets
        if (bet.Prediction == BetType.HomeWinToNil)
        {
            var isWinToNil = game.HomeScore > game.AwayScore && game.AwayScore == 0;
            status = isWinToNil ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        if (bet.Prediction == BetType.AwayWinToNil)
        {
            var isWinToNil = game.AwayScore > game.HomeScore && game.HomeScore == 0;
            status = isWinToNil ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        // Handle Over/Under bets explicitly
        if (bet.Prediction == BetType.Over || bet.Prediction == BetType.Under)
        {
            if (game.BetKind != BetType.OverOrUnder || !game.OverUnderLine.HasValue)
                return (BetStatus.Pending, null, null);

            var totalGoals = game.HomeScore.Value + game.AwayScore.Value;
            var actualResult = totalGoals > game.OverUnderLine.Value ? BetType.Over : BetType.Under;
            status = bet.Prediction == actualResult ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        // Handle 1/X/2 bets explicitly
        // For regular HomeWin/AwayWin bets, they should also win if the result is a win-to-nil
        if (bet.Prediction == BetType.HomeWin)
        {
            var isHomeWin = game.HomeScore > game.AwayScore;
            status = isHomeWin ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        if (bet.Prediction == BetType.AwayWin)
        {
            var isAwayWin = game.AwayScore > game.HomeScore;
            status = isAwayWin ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        if (bet.Prediction == BetType.Draw)
        {
            var isDraw = game.HomeScore == game.AwayScore;
            status = isDraw ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        // Handle other bet types (fallback)
        if (!game.ActualResult.HasValue)
            return (BetStatus.Pending, null, null);

        status = bet.Prediction == game.ActualResult ? BetStatus.Won : BetStatus.Lost;

        return (status, null, null);
    }
}
