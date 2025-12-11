using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixWeek3Selector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure rotation orders are correct (in case first migration didn't run)
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

            // Force week 3 to have Carlsson (Id=2) as selector, regardless of current value
            migrationBuilder.Sql(
                "UPDATE \"GameWeeks\" SET \"GameSelectorId\" = 2 WHERE \"WeekNumber\" = 3");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert week 3 selector back to Seeger (Id=4) - based on old rotation order
            migrationBuilder.Sql(
                "UPDATE \"GameWeeks\" SET \"GameSelectorId\" = 4 WHERE \"WeekNumber\" = 3");

            // Revert rotation orders
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
