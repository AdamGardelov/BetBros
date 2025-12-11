using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;

namespace BetBros.Server.Services;

public class InMemoryDataStore : IDataStore
{
    private readonly List<User> _users;
    private readonly List<GameWeek> _gameWeeks;
    private readonly List<Game> _games;
    private readonly List<Bet> _bets;
    private readonly List<Team> _teams;
    
    private int _nextGameWeekId = 2;
    private int _nextGameId = 1;
    private int _nextBetId = 1;
    private int _nextTeamId = 1;
    
    private readonly DateTime _weekOneStartDate = new(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc);

    public InMemoryDataStore()
    {
        // Initialize with seed data
        _users =
        [
            new User
            {
                Id = 3,
                Username = "danielsson",
                PasswordHash = PasswordHasher.HashPassword("password"),
                DisplayName = "Danielsson",
                RotationOrder = 0,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 1,
                Username = "gardelov",
                PasswordHash = PasswordHasher.HashPassword("password"),
                DisplayName = "Gärdelöv",
                RotationOrder = 1,
                IsAdmin = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 4,
                Username = "seeger",
                PasswordHash = PasswordHasher.HashPassword("password"),
                DisplayName = "Seeger",
                RotationOrder = 3,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Username = "carlsson",
                PasswordHash = PasswordHasher.HashPassword("password"),
                DisplayName = "Carlsson",
                RotationOrder = 2,
                CreatedAt = DateTime.UtcNow
            }
        ];

        // Create Week 1 with a calculated selector
        var weekNumber = RotationCalculator.GetCurrentWeekNumber(_weekOneStartDate);
        var selector = RotationCalculator.GetSelectorForWeek(weekNumber, _users);
        var weekStart = RotationCalculator.GetWeekStart(weekNumber, _weekOneStartDate);
        var weekEnd = RotationCalculator.GetWeekEnd(weekStart);

        _gameWeeks =
        [
            new GameWeek
            {
                Id = 1,
                WeekNumber = weekNumber,
                StartDate = weekStart,
                EndDate = weekEnd,
                GameSelectorId = selector.Id,
                IsComplete = false,
                CreatedAt = DateTime.UtcNow
            }
        ];

        _games = [];
        _bets = [];
        _teams = [];
    }

    // Users
    public List<User> GetUsers() => _users;
    public User? GetUserById(int id) => _users.FirstOrDefault(u => u.Id == id);
    public User? GetUserByUsername(string username) => _users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
    public User UpdateUser(User user)
    {
        var existingUser = _users.FirstOrDefault(u => u.Id == user.Id);
        if (existingUser != null)
        {
            existingUser.Username = user.Username;
            existingUser.PasswordHash = user.PasswordHash;
            existingUser.DisplayName = user.DisplayName;
            existingUser.RotationOrder = user.RotationOrder;
            existingUser.IsAdmin = user.IsAdmin;
            return existingUser;
        }
        return user;
    }

    // Game Weeks
    public List<GameWeek> GetGameWeeks() => _gameWeeks;
    public GameWeek? GetGameWeekById(int id) => _gameWeeks.FirstOrDefault(gw => gw.Id == id);

    public GameWeek GetCurrentGameWeek()
    {
        var currentWeekNumber = RotationCalculator.GetCurrentWeekNumber(_weekOneStartDate);
        var currentWeek = _gameWeeks.FirstOrDefault(gw => gw.WeekNumber == currentWeekNumber);

        // Auto-create if it doesn't exist
        if (currentWeek == null)
        {
            var orderedUsers = _users.OrderBy(u => u.RotationOrder).ToList();
            
            User selector;
            // Check if previous week exists - if so, use its selector to calculate current week
            // This respects manual changes to previous weeks
            var previousWeek = _gameWeeks.FirstOrDefault(gw => gw.WeekNumber == currentWeekNumber - 1);
            if (previousWeek != null)
            {
                // Use the previous week's actual selector (respects manual changes)
                var previousSelector = _users.FirstOrDefault(u => u.Id == previousWeek.GameSelectorId);
                if (previousSelector != null)
                {
                    var previousRotationOrder = previousSelector.RotationOrder;
                    var currentRotationOrder = (previousRotationOrder + 1) % orderedUsers.Count;
                    selector = orderedUsers[currentRotationOrder];
                }
                else
                {
                    // Fallback to rotation calculator
                    selector = RotationCalculator.GetSelectorForWeek(currentWeekNumber, _users);
                }
            }
            else
            {
                // No previous week exists, use rotation calculator
                selector = RotationCalculator.GetSelectorForWeek(currentWeekNumber, _users);
            }
            
            var weekStart = RotationCalculator.GetWeekStart(currentWeekNumber, _weekOneStartDate);
            var weekEnd = RotationCalculator.GetWeekEnd(weekStart);

            currentWeek = new GameWeek
            {
                Id = _nextGameWeekId++,
                WeekNumber = currentWeekNumber,
                StartDate = weekStart,
                EndDate = weekEnd,
                GameSelectorId = selector.Id,
                IsComplete = false,
                CreatedAt = DateTime.UtcNow
            };

            _gameWeeks.Add(currentWeek);
        }

        return currentWeek;
    }

    public GameWeek CreateGameWeek(GameWeek gameWeek)
    {
        gameWeek.Id = _nextGameWeekId++;
        _gameWeeks.Add(gameWeek);
        return gameWeek;
    }

    public GameWeek UpdateGameWeek(GameWeek gameWeek)
    {
        var existing = _gameWeeks.FirstOrDefault(gw => gw.Id == gameWeek.Id);
        if (existing != null)
        {
            _gameWeeks.Remove(existing);
            _gameWeeks.Add(gameWeek);
        }
        return gameWeek;
    }

    // Games
    public List<Game> GetGames() => _games;
    public List<Game> GetGamesByWeek(int gameWeekId) => _games.Where(g => g.GameWeekId == gameWeekId).ToList();
    public Game? GetGameById(int id) => _games.FirstOrDefault(g => g.Id == id);

    public Game CreateGame(Game game)
    {
        game.Id = _nextGameId++;
        _games.Add(game);
        return game;
    }

    public Game UpdateGame(Game game)
    {
        var existing = _games.FirstOrDefault(g => g.Id == game.Id);
        if (existing != null)
        {
            _games.Remove(existing);
            _games.Add(game);
        }
        return game;
    }

    public void DeleteGame(int gameId)
    {
        var game = _games.FirstOrDefault(g => g.Id == gameId);
        if (game != null)
        {
            _games.Remove(game);
        }
    }

    // Bets
    public List<Bet> GetBets() => _bets;
    public List<Bet> GetBetsByUser(int userId) => _bets.Where(b => b.UserId == userId).ToList();
    public List<Bet> GetBetsByGame(int gameId) => _bets.Where(b => b.GameId == gameId).ToList();
    public Bet? GetBetByUserAndGame(int userId, int gameId) => _bets.FirstOrDefault(b => b.UserId == userId && b.GameId == gameId);

    public Bet CreateBet(Bet bet)
    {
        bet.Id = _nextBetId++;
        _bets.Add(bet);
        return bet;
    }

    public Bet UpdateBet(Bet bet)
    {
        var existing = _bets.FirstOrDefault(b => b.Id == bet.Id);
        if (existing != null)
        {
            _bets.Remove(existing);
            _bets.Add(bet);
        }
        return bet;
    }

    // Teams
    public List<Team> GetTeams() => _teams.OrderBy(t => t.Name).ToList();

    public Team AddTeam(Team team)
    {
        team.Id = _nextTeamId++;
        _teams.Add(team);
        return team;
    }
}
