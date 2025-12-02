using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetBros.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$vK8YqZ9XqZ9XqZ9XqZ9XqeN5N5N5N5N5N5N5N5N5N5N5N5N5N5N5N");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$wL9ZrA0YrA0YrA0YrA0YreO6O6O6O6O6O6O6O6O6O6O6O6O6O6O6O");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$xM0AsB1ZsB1ZsB1ZsB1ZsfP7P7P7P7P7P7P7P7P7P7P7P7P7P7P7P");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$yN1BtC2AtC2AtC2AtC2AtgQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$XKVZvKJZ5Y5Y5Y5Y5Y5Y5uZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZ");
        }
    }
}
