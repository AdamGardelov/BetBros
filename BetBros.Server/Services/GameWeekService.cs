using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;

namespace BetBros.Server.Services;

public class GameWeekService(IDataStore dataStore, IGameService gameService) : IGameWeekService
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
        var orderedUsers = users.OrderBy(u => u.RotationOrder).ToList();
        
        // Check if current week exists - if so, use its selector to calculate next week
        // This respects manual changes to the current week
        User selector;
        var currentWeek = dataStore.GetGameWeeks().FirstOrDefault(w => w.WeekNumber == currentWeekNumber);
        if (currentWeek != null)
        {
            // Use the current week's actual selector (respects manual changes)
            var currentSelector = users.FirstOrDefault(u => u.Id == currentWeek.GameSelectorId);
            if (currentSelector != null)
            {
                var currentRotationOrder = currentSelector.RotationOrder;
                var nextRotationOrder = (currentRotationOrder + 1) % orderedUsers.Count;
                selector = orderedUsers[nextRotationOrder];
            }
            else
            {
                // Fallback to rotation calculator
                selector = RotationCalculator.GetSelectorForWeek(nextWeekNumber, users);
            }
        }
        else
        {
            // No current week exists, use rotation calculator
            selector = RotationCalculator.GetSelectorForWeek(nextWeekNumber, users);
        }
        
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

    public List<GameWeek> UpdateWeekGameSelectorWithCascade(int gameWeekId, int gameSelectorId)
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

        var users = dataStore.GetUsers().OrderBy(u => u.RotationOrder).ToList();
        var updatedWeeks = new List<GameWeek>();

        // Update the current week
        gameWeek.GameSelectorId = gameSelectorId;
        dataStore.UpdateGameWeek(gameWeek);
        updatedWeeks.Add(gameWeek);

        // Get the rotation order of the new selector
        var currentRotationOrder = selector.RotationOrder;

        // Update all subsequent weeks that don't have games
        var allWeeks = dataStore.GetGameWeeks().OrderBy(w => w.WeekNumber).ToList();
        var currentWeekNumber = gameWeek.WeekNumber;

        foreach (var week in allWeeks.Where(w => w.WeekNumber > currentWeekNumber))
        {
            // Check if this week has games - if so, skip it
            var games = gameService.GetGamesForWeek(week.Id);
            if (games.Count > 0)
            {
                // Stop cascading if we hit a week with games
                break;
            }

            // Calculate the next rotation order
            var nextRotationOrder = (currentRotationOrder + (week.WeekNumber - currentWeekNumber)) % users.Count;
            var nextSelector = users[nextRotationOrder];

            week.GameSelectorId = nextSelector.Id;
            dataStore.UpdateGameWeek(week);
            updatedWeeks.Add(week);
        }

        return updatedWeeks;
    }
}