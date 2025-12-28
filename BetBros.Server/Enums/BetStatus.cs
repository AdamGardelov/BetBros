namespace BetBros.Server.Enums;

public enum BetStatus
{
    Pending,        // Bet placed, game not completed
    Won,
    Lost,
    Refunded        // Money back (e.g., Draw No Bet when match ends in draw)
}