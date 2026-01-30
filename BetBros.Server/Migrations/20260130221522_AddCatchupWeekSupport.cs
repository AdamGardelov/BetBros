using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddCatchupWeekSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCatchup",
                table: "GameWeeks",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCatchup",
                table: "GameWeeks");
        }
    }
}
