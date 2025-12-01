using BetBros.Server.Enums;
using BetBros.Server.Models;
using BetBros.Server.Services.Interfaces;

namespace BetBros.Server.Services;

public class GameService(IDataStore dataStore, IBetService betService) : IGameService
{
    private const int MaxGamesPerWeek = 3;

    public List<Game> GetGamesForWeek(int gameWeekId)
    {
        return dataStore.GetGamesByWeek(gameWeekId)
            .OrderBy(g => g.CreatedAt)
            .ToList();
    }

    public Game CreateGame(int gameWeekId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine)
    {
        // Validate over/under line is provided for Over/Under bets
        if (betKind == BetType.OverOrUnder && !overUnderLine.HasValue)
        {
            throw new InvalidOperationException("Over/Under line must be specified for Over/Under bets");
        }

        // Validate max games per week
        var existingGames = dataStore.GetGamesByWeek(gameWeekId);
        if (existingGames.Count >= MaxGamesPerWeek)
        {
            throw new InvalidOperationException($"Maximum of {MaxGamesPerWeek} games per week");
        }

        // Validate game week exists
        var gameWeek = dataStore.GetGameWeekById(gameWeekId);
        if (gameWeek == null)
        {
            throw new InvalidOperationException("Game week not found");
        }

        var game = new Game
        {
            GameWeekId = gameWeekId,
            HomeTeam = homeTeam,
            AwayTeam = awayTeam,
            BetKind = betKind,
            OverUnderLine = overUnderLine,
            Status = GameStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };

        return dataStore.CreateGame(game);
    }

    public Game UpdateGame(int gameId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        if (!CanEditOrDeleteGame(gameId))
        {
            throw new InvalidOperationException("Cannot edit game - it has existing bets");
        }

        // Validate over/under line is provided for Over/Under bets
        if (betKind == BetType.OverOrUnder && !overUnderLine.HasValue)
        {
            throw new InvalidOperationException("Over/Under line must be specified for Over/Under bets");
        }

        game.HomeTeam = homeTeam;
        game.AwayTeam = awayTeam;
        game.BetKind = betKind;
        game.OverUnderLine = overUnderLine;

        return dataStore.UpdateGame(game);
    }

    public void DeleteGame(int gameId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        if (!CanEditOrDeleteGame(gameId))
        {
            throw new InvalidOperationException("Cannot delete game - it has existing bets");
        }

        dataStore.DeleteGame(gameId);
    }

    public bool CanEditOrDeleteGame(int gameId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null) return false;

        // Cannot edit/delete if any bets exist
        var bets = dataStore.GetBetsByGame(gameId);
        if (bets.Any()) return false;

        return true;
    }

    public Game EnterResults(int gameId, int homeScore, int awayScore, int userId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        if (!CanUserEnterResults(userId, gameId))
        {
            throw new UnauthorizedAccessException("Only the week's game selector can enter results");
        }

        game.HomeScore = homeScore;
        game.AwayScore = awayScore;
        game.Status = GameStatus.Completed;
        game.ResultEnteredAt = DateTime.UtcNow;
        game.ResultEnteredBy = userId;

        dataStore.UpdateGame(game);

        // Score all bets for this specific game (including re-scoring if results were updated)
        betService.ScoreGameBets(gameId);

        return game;
    }

    public bool CanUserEnterResults(int userId, int gameId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null) return false;

        var gameWeek = dataStore.GetGameWeekById(game.GameWeekId);
        return gameWeek != null && gameWeek.GameSelectorId == userId;
    }

    public Game CreateGameWithResults(int gameWeekId, int gameSelectorId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine, int homeScore, int awayScore, int enteredByUserId)
    {
        // Validate over/under line is provided for Over/Under bets
        if (betKind == BetType.OverOrUnder && !overUnderLine.HasValue)
        {
            throw new InvalidOperationException("Over/Under line must be specified for Over/Under bets");
        }

        // Validate game week exists
        var gameWeek = dataStore.GetGameWeekById(gameWeekId);
        if (gameWeek == null)
        {
            throw new InvalidOperationException("Game week not found");
        }

        // Validate game selector exists
        var selector = dataStore.GetUserById(gameSelectorId);
        if (selector == null)
        {
            throw new InvalidOperationException("Game selector not found");
        }

        // Validate entered by user exists
        var enteredBy = dataStore.GetUserById(enteredByUserId);
        if (enteredBy == null)
        {
            throw new InvalidOperationException("User who entered results not found");
        }

        // Admin method - bypass max games check
        // Note: This is an admin method, so we don't check MaxGamesPerWeek

        // Create game with results already set
        var game = new Game
        {
            GameWeekId = gameWeekId,
            HomeTeam = homeTeam,
            AwayTeam = awayTeam,
            BetKind = betKind,
            OverUnderLine = overUnderLine,
            Status = GameStatus.Completed,
            HomeScore = homeScore,
            AwayScore = awayScore,
            ResultEnteredAt = DateTime.UtcNow,
            ResultEnteredBy = enteredByUserId,
            CreatedAt = DateTime.UtcNow
        };

        var createdGame = dataStore.CreateGame(game);

        // Score all bets for this game (if any exist)
        betService.ScoreGameBets(createdGame.Id);

        return createdGame;
    }

    // Admin methods that bypass normal restrictions
    public Game AdminUpdateGame(int gameId, string homeTeam, string awayTeam, BetType betKind, decimal? overUnderLine)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        // Validate over/under line is provided for Over/Under bets
        if (betKind == BetType.OverOrUnder && !overUnderLine.HasValue)
        {
            throw new InvalidOperationException("Over/Under line must be specified for Over/Under bets");
        }

        game.HomeTeam = homeTeam;
        game.AwayTeam = awayTeam;
        game.BetKind = betKind;
        game.OverUnderLine = overUnderLine;

        return dataStore.UpdateGame(game);
    }

    public Game AdminEnterResults(int gameId, int homeScore, int awayScore, int userId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        game.HomeScore = homeScore;
        game.AwayScore = awayScore;
        game.Status = GameStatus.Completed;
        game.ResultEnteredAt = DateTime.UtcNow;
        game.ResultEnteredBy = userId;

        dataStore.UpdateGame(game);

        // Score all bets for this specific game (including re-scoring if results were updated)
        betService.ScoreGameBets(gameId);

        return game;
    }

    public void AdminDeleteGame(int gameId)
    {
        var game = dataStore.GetGameById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        dataStore.DeleteGame(gameId);
    }

}
