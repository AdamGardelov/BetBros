using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRotationOrderCarlssonSeeger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "RotationOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "RotationOrder",
                value: 3);

            // Update week 3 GameWeek to have Carlsson (Id=2) as selector instead of Seeger (Id=4)
            migrationBuilder.Sql(
                "UPDATE \"GameWeeks\" SET \"GameSelectorId\" = 2 WHERE \"WeekNumber\" = 3 AND \"GameSelectorId\" = 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert week 3 GameWeek selector back to Seeger (Id=4)
            migrationBuilder.Sql(
                "UPDATE \"GameWeeks\" SET \"GameSelectorId\" = 4 WHERE \"WeekNumber\" = 3 AND \"GameSelectorId\" = 2");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "RotationOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "RotationOrder",
                value: 2);
        }
    }
}
