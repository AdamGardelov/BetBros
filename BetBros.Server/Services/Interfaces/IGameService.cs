using BetBros.Server.Enums;
using BetBros.Server.Models;

namespace BetBros.Server.Services.Interfaces;

public interface IGameService
{
    List<Game> GetGamesForWeek(int gameWeekId);
    Game CreateGame(int gameWeekId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine);
    Game UpdateGame(int gameId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine);
    void DeleteGame(int gameId);
    bool CanEditOrDeleteGame(int gameId);
    Game EnterResults(int gameId, int homeScore, int awayScore, int userId);
    bool CanUserEnterResults(int userId, int gameId);
    Game CreateGameWithResults(int gameWeekId, int gameSelectorId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine, int homeScore, int awayScore, int enteredByUserId);
    // Admin methods that bypass restrictions
    Game AdminUpdateGame(int gameId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine);
    Game AdminEnterResults(int gameId, int homeScore, int awayScore, int userId);
    void AdminDeleteGame(int gameId);
}
