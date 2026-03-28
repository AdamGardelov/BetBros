import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { GameStatus, BetStatus } from '../types'
import type { User, GameWeek, Game, Bet } from '../types'

interface LeaderboardEntry {
  user: User; net_profit: number; total_bets: number; total_wins: number; accuracy_percent: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: async () => {
      const [usersRes, weeksRes, gamesRes, betsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('game_weeks').select('*'),
        supabase.from('games').select('*'),
        supabase.from('bets').select('*'),
      ])
      if (usersRes.error) throw usersRes.error
      if (weeksRes.error) throw weeksRes.error
      if (gamesRes.error) throw gamesRes.error
      if (betsRes.error) throw betsRes.error

      const users = usersRes.data as User[]
      const weeks = weeksRes.data as GameWeek[]
      const games = gamesRes.data as Game[]
      const bets = betsRes.data as Bet[]

      const completedWeekIds = new Set(
        weeks.filter((w) => {
          const weekGames = games.filter((g) => g.game_week_id === w.id)
          return weekGames.length > 0 &&
            weekGames.every((g) => g.status === GameStatus.Completed && g.home_score != null) &&
            w.net_profit != null
        }).map((w) => w.id),
      )

      return users.map((user) => {
        const userWeeks = weeks.filter((w) => w.game_selector_id === user.id && completedWeekIds.has(w.id))
        const netProfit = userWeeks.reduce((sum, w) => sum + (w.net_profit ?? 0), 0)
        const scoredBets = bets.filter((b) => b.user_id === user.id && b.scored_at != null)
        const totalWins = scoredBets.filter((b) => b.status === BetStatus.Won || b.status === BetStatus.Refunded).length
        return {
          user, net_profit: netProfit, total_bets: scoredBets.length, total_wins: totalWins,
          accuracy_percent: scoredBets.length > 0 ? (totalWins / scoredBets.length) * 100 : 0,
        } satisfies LeaderboardEntry
      }).sort((a, b) => b.net_profit - a.net_profit)
    },
  })
}
