using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLaLigaTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 20,
                column: "Name",
                value: "Wolverhampton");

            migrationBuilder.InsertData(
                table: "Teams",
                columns: new[] { "Id", "League", "Name" },
                values: new object[,]
                {
                    { 115, "La Liga", "Barcelona" },
                    { 116, "La Liga", "Real Madrid" },
                    { 117, "La Liga", "Villarreal" },
                    { 118, "La Liga", "Atlético Madrid" },
                    { 119, "La Liga", "Real Betis" },
                    { 120, "La Liga", "Espanyol" },
                    { 121, "La Liga", "Getafe" },
                    { 122, "La Liga", "Athletic Bilbao" },
                    { 123, "La Liga", "Rayo Vallecano" },
                    { 124, "La Liga", "Real Sociedad" },
                    { 125, "La Liga", "Elche" },
                    { 126, "La Liga", "Celta Vigo" },
                    { 127, "La Liga", "Sevilla" },
                    { 128, "La Liga", "Alavés" },
                    { 129, "La Liga", "Valencia" },
                    { 130, "La Liga", "Real Mallorca" },
                    { 131, "La Liga", "Osasuna" },
                    { 132, "La Liga", "Girona" },
                    { 133, "La Liga", "Levante" },
                    { 134, "La Liga", "Real Oviedo" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 118);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 119);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 120);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 121);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 122);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 123);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 124);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 125);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 126);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 127);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 128);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 129);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 130);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 131);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 132);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 133);

            migrationBuilder.DeleteData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 134);

            migrationBuilder.UpdateData(
                table: "Teams",
                keyColumn: "Id",
                keyValue: 20,
                column: "Name",
                value: "Wolverhampton Wanderers");
        }
    }
}
