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

        // Handle Draw No Bet (DNB) bets - money back on draw
        if (bet.Prediction == BetType.HomeWinDNB)
        {
            if (game.HomeScore == game.AwayScore)
                return (BetStatus.Refunded, null, null);
            status = game.HomeScore > game.AwayScore ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        if (bet.Prediction == BetType.AwayWinDNB)
        {
            if (game.HomeScore == game.AwayScore)
                return (BetStatus.Refunded, null, null);
            status = game.AwayScore > game.HomeScore ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        // Handle Asian Handicap bets
        if (bet.Prediction is BetType.HomeWinAH or BetType.AwayWinAH)
        {
            if (!game.AsianHandicapLine.HasValue)
                return (BetStatus.Pending, null, null);

            var handicap = game.AsianHandicapLine.Value;
            var adjustedHomeScore = game.HomeScore.Value + handicap;
            var scoreDifference = adjustedHomeScore - game.AwayScore.Value;

            // Check if this is a quarter handicap (0.25, 0.75, etc.)
            var isQuarterHandicap = (Math.Abs(handicap * 4) % 2) == 1;

            if (isQuarterHandicap)
            {
                // Quarter handicaps split the bet into two halves,
                // For example, -0.25 = split between 0 and -0.5,
                // For example, -0.75 = split between -0.5 and -1.0
                var lowerHandicap = Math.Floor(handicap * 2) / 2;
                var upperHandicap = Math.Ceiling(handicap * 2) / 2;

                var lowerAdjusted = game.HomeScore.Value + lowerHandicap;
                var upperAdjusted = game.HomeScore.Value + upperHandicap;

                var lowerDiff = lowerAdjusted - game.AwayScore.Value;
                var upperDiff = upperAdjusted - game.AwayScore.Value;

                var isHomeWin = bet.Prediction == BetType.HomeWinAH;

                // Determine a result for each half
                var lowerWins = isHomeWin ? lowerDiff > 0 : lowerDiff < 0;
                var lowerPushes = lowerDiff == 0;
                var upperWins = isHomeWin ? upperDiff > 0 : upperDiff < 0;
                var upperPushes = upperDiff == 0;

                // Both halves win = full win
                if (lowerWins && upperWins)
                    return (BetStatus.Won, null, null);

                // Both halves lose = full loss
                if (!lowerWins && !lowerPushes && !upperWins && !upperPushes)
                    return (BetStatus.Lost, null, null);

                // One half wins, one half pushes = half win (refund half stake)
                // One half loses, one half pushes = half loss (lose half stake)
                // For simplicity, we'll treat partial results as refunded for now
                // In a real system, you'd need BetStatus.HalfWon and BetStatus.HalfLost
                return (BetStatus.Refunded, null, null);
            }

            // Standard or half handicaps (0, 0.5, 1, 1.5, etc.)
            if (scoreDifference == 0)
            {
                // Push - refund the bet
                return (BetStatus.Refunded, null, null);
            }

            var won = (bet.Prediction == BetType.HomeWinAH && scoreDifference > 0) ||
                      (bet.Prediction == BetType.AwayWinAH && scoreDifference < 0);

            status = won ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        // Handle Handicap 3-Way bets
        if (bet.Prediction is BetType.HomeWinH3W or BetType.DrawH3W or BetType.AwayWinH3W)
        {
            if (!game.Handicap3WayLine.HasValue)
                return (BetStatus.Pending, null, null);

            var adjustedHomeScore = game.HomeScore.Value + game.Handicap3WayLine.Value;

            BetType actualResult;
            if (adjustedHomeScore > game.AwayScore.Value)
                actualResult = BetType.HomeWinH3W;
            else if (adjustedHomeScore < game.AwayScore.Value)
                actualResult = BetType.AwayWinH3W;
            else
                actualResult = BetType.DrawH3W;

            status = bet.Prediction == actualResult ? BetStatus.Won : BetStatus.Lost;
            return (status, null, null);
        }

        // Handle Over/Under bets explicitly
        if (bet.Prediction is BetType.Over or BetType.Under)
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
