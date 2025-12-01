using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;

namespace BetBros.Server.Services;

public class GameWeekService(IDataStore dataStore) : IGameWeekService
{
    private readonly DateTime _weekOneStartDate = new(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc);

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

    public GameWeek CreateWeek(int weekNumber, int gameSelectorId, DateTime startDate, DateTime endDate)
    {
        // Check if week number already exists
        var existingWeek = dataStore.GetGameWeeks().FirstOrDefault(w => w.WeekNumber == weekNumber);
        if (existingWeek != null)
        {
            throw new InvalidOperationException($"Week {weekNumber} already exists");
        }

        var selector = dataStore.GetUserById(gameSelectorId);
        if (selector == null)
        {
            throw new InvalidOperationException("Game selector not found");
        }

        var newWeek = new GameWeek
        {
            WeekNumber = weekNumber,
            StartDate = startDate,
            EndDate = endDate,
            GameSelectorId = gameSelectorId,
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

    public GameWeek UpdateWeekGameSelector(int gameWeekId, int gameSelectorId)
    {
        var gameWeek = dataStore.GetGameWeekById(gameWeekId);
        if (gameWeek == null)
        {
            throw new InvalidOperationException("Game week not found");
        }

        var selector = dataStore.GetUserById(gameSelectorId);
        if (selector == null)
        {
            throw new InvalidOperationException("Game selector not found");
        }

        gameWeek.GameSelectorId = gameSelectorId;
        return dataStore.UpdateGameWeek(gameWeek);
    }
}