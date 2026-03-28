export const queryKeys = {
  auth: ['auth'] as const,
  users: ['users'] as const,
  gameWeeks: {
    all: ['gameWeeks'] as const,
    detail: (id: string) => ['gameWeeks', id] as const,
    current: ['gameWeeks', 'current'] as const,
  },
  games: {
    byWeek: (weekId: string) => ['games', weekId] as const,
  },
  bets: {
    byWeek: (weekId: string) => ['bets', weekId] as const,
    byWeekAndUser: (weekId: string, userId: string) => ['bets', weekId, userId] as const,
  },
  leaderboard: ['leaderboard'] as const,
  stats: {
    financial: ['stats', 'financial'] as const,
    summary: ['stats', 'summary'] as const,
    users: ['stats', 'users'] as const,
  },
  teams: ['teams'] as const,
}
