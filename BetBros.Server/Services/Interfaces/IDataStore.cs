using BetBros.Server.Models;

namespace BetBros.Server.Services.Interfaces;

// Central data access - easily swappable for database
public interface IDataStore
{
    // Users
    List<User> GetUsers();
    User? GetUserById(int id);
    User? GetUserByUsername(string username);

    // Game Weeks
    List<GameWeek> GetGameWeeks();
    GameWeek? GetGameWeekById(int id);
    GameWeek? GetCurrentGameWeek();
    GameWeek CreateGameWeek(GameWeek gameWeek);
    GameWeek UpdateGameWeek(GameWeek gameWeek);

    // Games
    List<Game> GetGames();
    List<Game> GetGamesByWeek(int gameWeekId);
    Game? GetGameById(int id);
    Game CreateGame(Game game);
    Game UpdateGame(Game game);
    void DeleteGame(int gameId);

    // Bets
    List<Bet> GetBets();
    List<Bet> GetBetsByUser(int userId);
    List<Bet> GetBetsByGame(int gameId);
    Bet? GetBetByUserAndGame(int userId, int gameId);
    Bet CreateBet(Bet bet);
    Bet UpdateBet(Bet bet);
}
