using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddCancelledWeekSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCancelled",
                table: "GameWeeks",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCancelled",
                table: "GameWeeks");
        }
    }
}
