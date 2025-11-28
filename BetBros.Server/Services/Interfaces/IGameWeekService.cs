using BetBros.Server.Models;

namespace BetBros.Server.Services.Interfaces;

public interface IGameWeekService
{
    GameWeek GetCurrentWeek();
    GameWeek CreateNewWeek();  // Auto-calculates next selector
    User? GetWeekSelector(int gameWeekId);
    List<GameWeek> GetAllWeeks();
    bool CanUserSelectGames(int userId, int gameWeekId);
    GameWeek UpdateWeekNetProfit(int gameWeekId, decimal? netProfit);
}
