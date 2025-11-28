using BetBros.Server.Enums;

namespace BetBros.Server.Models;

public class Bet
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public int UserId { get; set; }

    // The user's prediction
    public BetType Prediction { get; set; }

    // For ExactScore predictions
    public int? PredictedHomeScore { get; set; }
    public int? PredictedAwayScore { get; set; }

    // Odds and stake
    public decimal? Odds { get; set; }  // Decimal odds (e.g., 2.5)
    public decimal Stake { get; set; }  // Amount bet (33.33kr per bet)

    // Status and financial results (null until game completed)
    public BetStatus Status { get; set; }
    public decimal? Payout { get; set; }  // Calculated when bet is scored (Stake × Odds if won, 0 if lost)
    public decimal? Profit { get; set; }   // Payout - Stake (negative if lost)
    
    [Obsolete("Points system replaced by odds-based betting")]
    public int? Points { get; set; }  // Legacy: 5 points if won (deprecated)

    public DateTime PlacedAt { get; set; }
    public DateTime? ScoredAt { get; set; }
}
