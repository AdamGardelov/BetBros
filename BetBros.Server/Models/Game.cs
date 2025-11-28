using BetBros.Server.Enums;

namespace BetBros.Server.Models;

public class Game
{
    public int Id { get; set; }
    public int GameWeekId { get; set; }
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;

    // What type of bet is this game for?
    public BetType BetKind { get; set; }

    // Only used for Over/Under bets (e.g., 2.5 goals)
    public decimal? OverUnderLine { get; set; }

    public GameStatus Status { get; set; }

    // Results (null until entered)
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public DateTime? ResultEnteredAt { get; set; }
    public int? ResultEnteredBy { get; set; }

    public DateTime CreatedAt { get; set; }

    // Get the actual result based on the bet kind
    public BetType? ActualResult
    {
        get
        {
            if (!HomeScore.HasValue || !AwayScore.HasValue) return null;

            switch (BetKind)
            {
                case BetType.HomeWin:
                case BetType.Draw:
                case BetType.AwayWin:
                    // 1/X/2 bet - return an actual match result
                    // Check for win-to-nil scenarios first
                    if (HomeScore > AwayScore && AwayScore == 0) return BetType.HomeWinToNil;
                    if (AwayScore > HomeScore && HomeScore == 0) return BetType.AwayWinToNil;
                    // Regular win/draw results
                    if (HomeScore > AwayScore) return BetType.HomeWin;
                    if (HomeScore < AwayScore) return BetType.AwayWin;
                    return BetType.Draw;

                case BetType.OverOrUnder:
                    // Over/Under bet - return whether total goals are over or under the line
                    if (!OverUnderLine.HasValue) return null;
                    var totalGoals = HomeScore.Value + AwayScore.Value;
                    return totalGoals > OverUnderLine.Value ? BetType.Over : BetType.Under;

                default:
                    return null;
            }
        }
    }
}
