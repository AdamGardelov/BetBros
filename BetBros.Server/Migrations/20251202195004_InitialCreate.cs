using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GameId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Prediction = table.Column<int>(type: "INTEGER", nullable: false),
                    PredictedHomeScore = table.Column<int>(type: "INTEGER", nullable: true),
                    PredictedAwayScore = table.Column<int>(type: "INTEGER", nullable: true),
                    Stake = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Payout = table.Column<decimal>(type: "TEXT", nullable: true),
                    Profit = table.Column<decimal>(type: "TEXT", nullable: true),
                    Points = table.Column<int>(type: "INTEGER", nullable: true),
                    PlacedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ScoredAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Games",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GameWeekId = table.Column<int>(type: "INTEGER", nullable: false),
                    HomeTeam = table.Column<string>(type: "TEXT", nullable: false),
                    AwayTeam = table.Column<string>(type: "TEXT", nullable: false),
                    BetKind = table.Column<int>(type: "INTEGER", nullable: false),
                    OverUnderLine = table.Column<decimal>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    HomeScore = table.Column<int>(type: "INTEGER", nullable: true),
                    AwayScore = table.Column<int>(type: "INTEGER", nullable: true),
                    ResultEnteredAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ResultEnteredBy = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Games", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GameWeeks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeekNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    GameSelectorId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsComplete = table.Column<bool>(type: "INTEGER", nullable: false),
                    NetProfit = table.Column<decimal>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameWeeks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    League = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    RotationOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsAdmin = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Teams",
                columns: new[] { "Id", "League", "Name" },
                values: new object[,]
                {
                    { 1, "Premier League", "Arsenal" },
                    { 2, "Premier League", "Manchester City" },
                    { 3, "Premier League", "Chelsea" },
                    { 4, "Premier League", "Aston Villa" },
                    { 5, "Premier League", "Brighton" },
                    { 6, "Premier League", "Sunderland" },
                    { 7, "Premier League", "Manchester United" },
                    { 8, "Premier League", "Liverpool" },
                    { 9, "Premier League", "Crystal Palace" },
                    { 10, "Premier League", "Bournemouth" },
                    { 11, "Premier League", "Brentford" },
                    { 12, "Premier League", "Everton" },
                    { 13, "Premier League", "Tottenham" },
                    { 14, "Premier League", "Newcastle" },
                    { 15, "Premier League", "Fulham" },
                    { 16, "Premier League", "Nottingham Forest" },
                    { 17, "Premier League", "West Ham" },
                    { 18, "Premier League", "Leeds United" },
                    { 19, "Premier League", "Burnley" },
                    { 20, "Premier League", "Wolverhampton Wanderers" },
                    { 21, "Championship", "Coventry City" },
                    { 22, "Championship", "Middlesbrough" },
                    { 23, "Championship", "Millwall" },
                    { 24, "Championship", "Stoke City" },
                    { 25, "Championship", "Preston North End" },
                    { 26, "Championship", "Bristol City" },
                    { 27, "Championship", "Birmingham City" },
                    { 28, "Championship", "Hull City" },
                    { 29, "Championship", "Ipswich Town" },
                    { 30, "Championship", "Wrexham" },
                    { 31, "Championship", "Derby County" },
                    { 32, "Championship", "West Bromwich Albion" },
                    { 33, "Championship", "Queens Park Rangers" },
                    { 34, "Championship", "Southampton" },
                    { 35, "Championship", "Watford" },
                    { 36, "Championship", "Leicester City" },
                    { 37, "Championship", "Charlton Athletic" },
                    { 38, "Championship", "Blackburn Rovers" },
                    { 39, "Championship", "Sheffield United" },
                    { 40, "Championship", "Oxford United" },
                    { 41, "Championship", "Swansea City" },
                    { 42, "Championship", "Portsmouth" },
                    { 43, "Championship", "Norwich City" },
                    { 44, "Championship", "Sheffield Wednesday" },
                    { 45, "Serie A", "AC Milan" },
                    { 46, "Serie A", "Napoli" },
                    { 47, "Serie A", "Inter Milan" },
                    { 48, "Serie A", "AS Roma" },
                    { 49, "Serie A", "Como 1907" },
                    { 50, "Serie A", "Bologna" },
                    { 51, "Serie A", "Juventus" },
                    { 52, "Serie A", "Lazio" },
                    { 53, "Serie A", "Udinese" },
                    { 54, "Serie A", "Sassuolo" },
                    { 55, "Serie A", "Cremonese" },
                    { 56, "Serie A", "Atalanta" },
                    { 57, "Serie A", "Torino" },
                    { 58, "Serie A", "Lecce" },
                    { 59, "Serie A", "Cagliari" },
                    { 60, "Serie A", "Genoa" },
                    { 61, "Serie A", "Parma" },
                    { 62, "Serie A", "Pisa SC" },
                    { 63, "Serie A", "Fiorentina" },
                    { 64, "Serie A", "Hellas Verona" },
                    { 65, "Ligue 1", "RC Lens" },
                    { 66, "Ligue 1", "Paris Saint-Germain" },
                    { 67, "Ligue 1", "Olympique de Marseille" },
                    { 68, "Ligue 1", "LOSC Lille" },
                    { 69, "Ligue 1", "Stade Rennais" },
                    { 70, "Ligue 1", "Olympique Lyonnais" },
                    { 71, "Ligue 1", "AS Monaco" },
                    { 72, "Ligue 1", "RC Strasbourg Alsace" },
                    { 73, "Ligue 1", "Toulouse FC" },
                    { 74, "Ligue 1", "OGC Nice" },
                    { 75, "Ligue 1", "Stade Brestois" },
                    { 76, "Ligue 1", "Angers SCO" },
                    { 77, "Ligue 1", "Paris FC" },
                    { 78, "Ligue 1", "Le Havre AC" },
                    { 79, "Ligue 1", "FC Lorient" },
                    { 80, "Ligue 1", "FC Nantes" },
                    { 81, "Ligue 1", "FC Metz" },
                    { 82, "Ligue 1", "AJ Auxerre" },
                    { 83, "Allsvenskan", "Mjällby" },
                    { 84, "Allsvenskan", "Hammarby" },
                    { 85, "Allsvenskan", "GAIS" },
                    { 86, "Allsvenskan", "IFK Göteborg" },
                    { 87, "Allsvenskan", "Djurgården" },
                    { 88, "Allsvenskan", "Malmö FF" },
                    { 89, "Allsvenskan", "AIK" },
                    { 90, "Allsvenskan", "Elfsborg" },
                    { 91, "Allsvenskan", "Sirius" },
                    { 92, "Allsvenskan", "Häcken" },
                    { 93, "Allsvenskan", "Halmstad" },
                    { 94, "Allsvenskan", "Brommapojkarna" },
                    { 95, "Allsvenskan", "Degerfors" },
                    { 96, "Allsvenskan", "Norrköping" },
                    { 97, "Allsvenskan", "Öster" },
                    { 98, "Allsvenskan", "Värnamo" },
                    { 99, "Superettan", "Västerås SK" },
                    { 100, "Superettan", "Kalmar FF" },
                    { 101, "Superettan", "Örgryte" },
                    { 102, "Superettan", "Oddevold" },
                    { 103, "Superettan", "Falkenberg" },
                    { 104, "Superettan", "Varbergs BoIS" },
                    { 105, "Superettan", "Helsingborg" },
                    { 106, "Superettan", "Brage" },
                    { 107, "Superettan", "BoIS" },
                    { 108, "Superettan", "Sandviken" },
                    { 109, "Superettan", "Sundsvall" },
                    { 110, "Superettan", "Östersund" },
                    { 111, "Superettan", "Utsikten" },
                    { 112, "Superettan", "Örebro" },
                    { 113, "Superettan", "Trelleborg" },
                    { 114, "Superettan", "Umeå FC" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "DisplayName", "IsAdmin", "PasswordHash", "RotationOrder", "Username" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 11, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Gärdelöv", true, "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ", 1, "gardelov" },
                    { 2, new DateTime(2025, 11, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Carlsson", false, "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ", 3, "carlsson" },
                    { 3, new DateTime(2025, 11, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Danielsson", false, "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ", 0, "danielsson" },
                    { 4, new DateTime(2025, 11, 24, 0, 0, 0, 0, DateTimeKind.Utc), "Seeger", false, "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ", 2, "seeger" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bets");

            migrationBuilder.DropTable(
                name: "Games");

            migrationBuilder.DropTable(
                name: "GameWeeks");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
