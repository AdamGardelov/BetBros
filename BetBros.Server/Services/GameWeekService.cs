using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;

namespace BetBros.Server.Services;

public class GameWeekService(IDataStore dataStore) : IGameWeekService
{
    private readonly DateTime _weekOneStartDate = new(2025, 11, 28, 0, 0, 0, DateTimeKind.Utc);

    public GameWeek GetCurrentWeek()
    {
        return dataStore.GetCurrentGameWeek()
               ?? throw new InvalidOperationException("Current game week not found");
    }

    public GameWeek CreateNewWeek()
    {
        var currentWeekNumber = RotationCalculator.GetCurrentWeekNumber(_weekOneStartDate);
        var nextWeekNumber = currentWeekNumber + 1;

        var users = dataStore.GetUsers();
        var selector = RotationCalculator.GetSelectorForWeek(nextWeekNumber, users);
        var weekStart = RotationCalculator.GetWeekStart(nextWeekNumber, _weekOneStartDate);
        var weekEnd = RotationCalculator.GetWeekEnd(weekStart);

        var newWeek = new GameWeek
        {
            WeekNumber = nextWeekNumber,
            StartDate = weekStart,
            EndDate = weekEnd,
            GameSelectorId = selector.Id,
            IsComplete = false,
            CreatedAt = DateTime.UtcNow
        };

        return dataStore.CreateGameWeek(newWeek);
    }

    public User? GetWeekSelector(int gameWeekId)
    {
        var gameWeek = dataStore.GetGameWeekById(gameWeekId);
        if (gameWeek == null) return null;

        return dataStore.GetUserById(gameWeek.GameSelectorId);
    }

    public List<GameWeek> GetAllWeeks()
    {
        return dataStore.GetGameWeeks().OrderBy(gw => gw.WeekNumber).ToList();
    }

    public bool CanUserSelectGames(int userId, int gameWeekId)
    {
        var gameWeek = dataStore.GetGameWeekById(gameWeekId);
        return gameWeek != null && gameWeek.GameSelectorId == userId;
    }

    public GameWeek UpdateWeekNetProfit(int gameWeekId, decimal? netProfit)
    {
        var gameWeek = dataStore.GetGameWeekById(gameWeekId);
        if (gameWeek == null)
        {
            throw new InvalidOperationException("Game week not found");
        }

        gameWeek.NetProfit = netProfit;
        return dataStore.UpdateGameWeek(gameWeek);
    }
}