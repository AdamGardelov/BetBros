using BetBros.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace BetBros.Server.Services;

public class BetBrosDbContext(DbContextOptions<BetBrosDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<GameWeek> GameWeeks { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<Bet> Bets { get; set; }
    public DbSet<Team> Teams { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Static password hashes - generated once to avoid non-deterministic seeding
        const string hash1 = "$2a$11$13y8bUOBLMLcqEXgkB/pPusghKhPV29R3wp1FwvdWgq.Jn5LEh3HO";
        const string hash2 = "$2a$11$V26L1B.sfS3m0zGg.phsaORWlaSL5kf28.siT2WPY1a0grcU7aM9u";
        const string hash3 = "$2a$11$JTQ4wP5h1z8qSBqcuPdb.e10i6mgCgNMftf3WDCZjOaEXk0CfvByK";
        const string hash4 = "$2a$11$gHrkkjS8QZ4RAyYlj4w6DOqfWQETdWS1lDqIn2xvSiQpzQNglQuu2";

        // Seed Users
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "gardelov",
                PasswordHash = hash1,
                DisplayName = "Gärdelöv",
                RotationOrder = 1,
                IsAdmin = true,
                CreatedAt = new DateTime(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 2,
                Username = "carlsson",
                PasswordHash = hash2,
                DisplayName = "Carlsson",
                RotationOrder = 3,
                CreatedAt = new DateTime(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 3,
                Username = "danielsson",
                PasswordHash = hash3,
                DisplayName = "Danielsson",
                RotationOrder = 0,
                CreatedAt = new DateTime(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Id = 4,
                Username = "seeger",
                PasswordHash = hash4,
                DisplayName = "Seeger",
                RotationOrder = 2,
                CreatedAt = new DateTime(2025, 11, 24, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        // Seed Teams
        var teams = new List<Team>();
        int id = 1;

        // Premier League
        var plTeams = new[] { "Arsenal", "Manchester City", "Chelsea", "Aston Villa", "Brighton", "Sunderland", "Manchester United", "Liverpool", "Crystal Palace", "Bournemouth", "Brentford", "Everton", "Tottenham", "Newcastle", "Fulham", "Nottingham Forest", "West Ham", "Leeds United", "Burnley", "Wolverhampton" };
        foreach (var name in plTeams) teams.Add(new Team { Id = id++, Name = name, League = "Premier League" });

        // Championship
        var champTeams = new[] { "Coventry City", "Middlesbrough", "Millwall", "Stoke City", "Preston North End", "Bristol City", "Birmingham City", "Hull City", "Ipswich Town", "Wrexham", "Derby County", "West Bromwich Albion", "Queens Park Rangers", "Southampton", "Watford", "Leicester City", "Charlton Athletic", "Blackburn Rovers", "Sheffield United", "Oxford United", "Swansea City", "Portsmouth", "Norwich City", "Sheffield Wednesday" };
        foreach (var name in champTeams) teams.Add(new Team { Id = id++, Name = name, League = "Championship" });

        // Serie A
        var serieATeams = new[] { "AC Milan", "Napoli", "Inter Milan", "AS Roma", "Como 1907", "Bologna", "Juventus", "Lazio", "Udinese", "Sassuolo", "Cremonese", "Atalanta", "Torino", "Lecce", "Cagliari", "Genoa", "Parma", "Pisa SC", "Fiorentina", "Hellas Verona" };
        foreach (var name in serieATeams) teams.Add(new Team { Id = id++, Name = name, League = "Serie A" });

        // Ligue 1
        var ligue1Teams = new[] { "RC Lens", "Paris Saint-Germain", "Olympique de Marseille", "LOSC Lille", "Stade Rennais", "Olympique Lyonnais", "AS Monaco", "RC Strasbourg Alsace", "Toulouse FC", "OGC Nice", "Stade Brestois", "Angers SCO", "Paris FC", "Le Havre AC", "FC Lorient", "FC Nantes", "FC Metz", "AJ Auxerre" };
        foreach (var name in ligue1Teams) teams.Add(new Team { Id = id++, Name = name, League = "Ligue 1" });

        // Allsvenskan
        var allsvenskanTeams = new[] { "Mjällby", "Hammarby", "GAIS", "IFK Göteborg", "Djurgården", "Malmö FF", "AIK", "Elfsborg", "Sirius", "Häcken", "Halmstad", "Brommapojkarna", "Degerfors", "Norrköping", "Öster", "Värnamo" };
        foreach (var name in allsvenskanTeams) teams.Add(new Team { Id = id++, Name = name, League = "Allsvenskan" });

        // Superettan
        var superettanTeams = new[] { "Västerås SK", "Kalmar FF", "Örgryte", "Oddevold", "Falkenberg", "Varbergs BoIS", "Helsingborg", "Brage", "BoIS", "Sandviken", "Sundsvall", "Östersund", "Utsikten", "Örebro", "Trelleborg", "Umeå FC" };
        foreach (var name in superettanTeams) teams.Add(new Team { Id = id++, Name = name, League = "Superettan" });

        modelBuilder.Entity<Team>().HasData(teams.ToArray());
    }
}
