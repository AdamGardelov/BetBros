using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;
using BetBros.Server.Utils;
using Microsoft.EntityFrameworkCore;

namespace BetBros.Server.Services;

public class SqliteDataStore : IDataStore
{
    private readonly BetBrosDbContext _context;
    private readonly DateTime _weekOneStartDate = new(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc);

    public SqliteDataStore(BetBrosDbContext context)
    {
        _context = context;
    }

    // Users
    public List<User> GetUsers() => _context.Users.ToList();
    public User? GetUserById(int id) => _context.Users.FirstOrDefault(u => u.Id == id);
    public User? GetUserByUsername(string username) => _context.Users.FirstOrDefault(u => u.Username.ToLower() == username.ToLower());

    // Game Weeks
    public List<GameWeek> GetGameWeeks() => _context.GameWeeks.OrderBy(gw => gw.WeekNumber).ToList();
    public GameWeek? GetGameWeekById(int id) => _context.GameWeeks.FirstOrDefault(gw => gw.Id == id);

    public GameWeek GetCurrentGameWeek()
    {
        var currentWeekNumber = RotationCalculator.GetCurrentWeekNumber(_weekOneStartDate);
        var currentWeek = _context.GameWeeks.FirstOrDefault(gw => gw.WeekNumber == currentWeekNumber);

        // Auto-create if it doesn't exist
        if (currentWeek == null)
        {
            var users = GetUsers();
            var selector = RotationCalculator.GetSelectorForWeek(currentWeekNumber, users);
            var weekStart = RotationCalculator.GetWeekStart(currentWeekNumber, _weekOneStartDate);
            var weekEnd = RotationCalculator.GetWeekEnd(weekStart);

            currentWeek = new GameWeek
            {
                WeekNumber = currentWeekNumber,
                StartDate = weekStart,
                EndDate = weekEnd,
                GameSelectorId = selector.Id,
                IsComplete = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.GameWeeks.Add(currentWeek);
            _context.SaveChanges();
        }

        return currentWeek;
    }

    public GameWeek CreateGameWeek(GameWeek gameWeek)
    {
        _context.GameWeeks.Add(gameWeek);
        _context.SaveChanges();
        return gameWeek;
    }

    public GameWeek UpdateGameWeek(GameWeek gameWeek)
    {
        _context.GameWeeks.Update(gameWeek);
        _context.SaveChanges();
        return gameWeek;
    }

    // Games
    public List<Game> GetGames() => _context.Games.ToList();
    public List<Game> GetGamesByWeek(int gameWeekId) => _context.Games.Where(g => g.GameWeekId == gameWeekId).ToList();
    public Game? GetGameById(int id) => _context.Games.FirstOrDefault(g => g.Id == id);

    public Game CreateGame(Game game)
    {
        _context.Games.Add(game);
        _context.SaveChanges();
        return game;
    }

    public Game UpdateGame(Game game)
    {
        _context.Games.Update(game);
        _context.SaveChanges();
        return game;
    }

    public void DeleteGame(int gameId)
    {
        var game = _context.Games.FirstOrDefault(g => g.Id == gameId);
        if (game != null)
        {
            _context.Games.Remove(game);
            _context.SaveChanges();
        }
    }

    // Bets
    public List<Bet> GetBets() => _context.Bets.ToList();
    public List<Bet> GetBetsByUser(int userId) => _context.Bets.Where(b => b.UserId == userId).ToList();
    public List<Bet> GetBetsByGame(int gameId) => _context.Bets.Where(b => b.GameId == gameId).ToList();
    public Bet? GetBetByUserAndGame(int userId, int gameId) => _context.Bets.FirstOrDefault(b => b.UserId == userId && b.GameId == gameId);

    public Bet CreateBet(Bet bet)
    {
        _context.Bets.Add(bet);
        _context.SaveChanges();
        return bet;
    }

    public Bet UpdateBet(Bet bet)
    {
        _context.Bets.Update(bet);
        _context.SaveChanges();
        return bet;
    }

    // Teams
    public List<Team> GetTeams() => _context.Teams.OrderBy(t => t.Name).ToList();

    public Team AddTeam(Team team)
    {
        _context.Teams.Add(team);
        _context.SaveChanges();
        return team;
    }
}
