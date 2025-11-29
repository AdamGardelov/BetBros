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

    // Stake
    public decimal Stake { get; set; }  // Amount bet (33.33kr per bet)

    // Status and financial results (null until game completed)
    public BetStatus Status { get; set; }
    public decimal? Payout { get; set; }  // Not used anymore (kept for compatibility)
    public decimal? Profit { get; set; }   // Not used anymore (kept for compatibility)
    
    [Obsolete("Points system deprecated")]
    public int? Points { get; set; }  // Legacy: 5 points if won (deprecated)

    public DateTime PlacedAt { get; set; }
    public DateTime? ScoredAt { get; set; }
}
