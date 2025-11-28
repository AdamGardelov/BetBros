namespace BetBros.Server.Enums;

public enum BetType
{
    HomeWin = 1,    // 1
    Draw = 2,       // X
    AwayWin = 3,    // 2
    Over = 4,       // Over X.5 goals (prediction)
    Under = 5,      // Under X.5 goals (prediction)
    OverOrUnder = 6, // Over/Under game type (not a prediction)
    ExactScore = 7,  // Exact score prediction
    HomeWinToNil = 8, // The home team wins and keeps a clean sheet (away team scores 0)
    AwayWinToNil = 9  // The away team wins and keeps a clean sheet (home team scores 0)
}