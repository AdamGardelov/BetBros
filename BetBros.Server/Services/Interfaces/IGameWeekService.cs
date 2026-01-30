using BetBros.Server.Models;

namespace BetBros.Server.Services.Interfaces;

public interface IGameWeekService
{
    GameWeek GetCurrentWeek();
    GameWeek CreateNewWeek();  // Auto-calculates next selector
    GameWeek CreateWeek(int weekNumber, int gameSelectorId, DateTime startDate, DateTime endDate);  // Admin method to create week with specific details
    GameWeek CreateCancelledWeek(int weekNumber);  // Admin method to create a cancelled/skipped week
    GameWeek CreateCatchupWeek(int gameSelectorId);  // Admin method to create a catchup week for a player
    User? GetWeekSelector(int gameWeekId);
    List<GameWeek> GetAllWeeks();
    bool CanUserSelectGames(int userId, int gameWeekId);
    GameWeek UpdateWeekNetProfit(int gameWeekId, decimal? netProfit);
    GameWeek UpdateWeekGameSelector(int gameWeekId, int gameSelectorId);
    List<GameWeek> UpdateWeekGameSelectorWithCascade(int gameWeekId, int gameSelectorId);
}
