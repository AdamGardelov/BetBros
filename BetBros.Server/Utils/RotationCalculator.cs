using BetBros.Server.Models;

namespace BetBros.Server.Utils;

public static class RotationCalculator
{
    // Given a week number and list of users, determine who selects games
    public static User GetSelectorForWeek(int weekNumber, List<User> users)
    {
        // Users are ordered by RotationOrder (0, 1, 2, 3)
        var orderedUsers = users.OrderBy(u => u.RotationOrder).ToList();
        var index = (weekNumber - 1) % orderedUsers.Count;
        return orderedUsers[index];
    }

    public static DateTime GetWeekStart(int weekNumber, DateTime baseDate)
    {
        // Week 1 starts on the base date (configured Monday)
        return baseDate.AddDays((weekNumber - 1) * 7);
    }

    public static DateTime GetWeekEnd(DateTime weekStart)
    {
        return weekStart.AddDays(6).AddHours(23).AddMinutes(59).AddSeconds(59);
    }

    public static int GetCurrentWeekNumber(DateTime baseDate)
    {
        var daysSinceBase = (DateTime.UtcNow - baseDate).TotalDays;
        if (daysSinceBase < 0) return 1; // Before week 1 starts
        return (int)(daysSinceBase / 7) + 1;
    }
}
