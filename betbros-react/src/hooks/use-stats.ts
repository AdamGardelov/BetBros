import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { WEEKLY_STAKE } from '../lib/constants'
import { GameStatus } from '../types'
import type { User, GameWeek, Game, FinancialStats, FinancialSummary } from '../types'

export function useFinancialStats() {
  return useQuery({
    queryKey: queryKeys.stats.financial,
    queryFn: async () => {
      const [usersRes, weeksRes, gamesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('game_weeks').select('*'),
        supabase.from('games').select('*'),
      ])
      if (usersRes.error) throw usersRes.error
      if (weeksRes.error) throw weeksRes.error
      if (gamesRes.error) throw gamesRes.error

      const users = usersRes.data as User[]
      const weeks = weeksRes.data as GameWeek[]
      const games = gamesRes.data as Game[]

      const completedWeeks = weeks.filter((w) => {
        const weekGames = games.filter((g) => g.game_week_id === w.id)
        return weekGames.length > 0 &&
          weekGames.every((g) => g.status === GameStatus.Completed && g.home_score != null) &&
          w.net_profit != null
      })

      const stats: Record<string, FinancialStats> = {}
      for (const user of users) {
        const userWeeks = completedWeeks.filter((w) => w.game_selector_id === user.id)
        const totalGamesPlayed = userWeeks.reduce((sum, w) => sum + games.filter((g) => g.game_week_id === w.id).length, 0)
        let totalBet = userWeeks.length * WEEKLY_STAKE
        const totalWon = userWeeks.filter((w) => w.net_profit != null && w.net_profit > 0).reduce((sum, w) => sum + w.net_profit!, 0)
        const totalLost = userWeeks.filter((w) => w.net_profit != null && w.net_profit < 0).reduce((sum, w) => sum + Math.abs(w.net_profit!), 0)
        const netProfit = userWeeks.reduce((sum, w) => sum + (w.net_profit ?? 0), 0)
        if (netProfit < 0 && Math.abs(netProfit) > totalBet) totalBet = Math.abs(netProfit)
        let roi = totalBet > 0 ? (netProfit / totalBet) * 100 : 0
        if (roi < -100) roi = -100
        stats[user.id] = { total_bet: totalBet, total_won: totalWon, total_lost: totalLost, net_profit: netProfit, roi_percent: roi, weeks_participated: userWeeks.length, total_games_played: totalGamesPlayed }
      }
      return { stats, users }
    },
  })
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: async () => {
      const [weeksRes, gamesRes] = await Promise.all([
        supabase.from('game_weeks').select('*'),
        supabase.from('games').select('*'),
      ])
      if (weeksRes.error) throw weeksRes.error
      if (gamesRes.error) throw gamesRes.error

      const weeks = weeksRes.data as GameWeek[]
      const games = gamesRes.data as Game[]
      const completedWeeks = weeks.filter((w) => {
        const weekGames = games.filter((g) => g.game_week_id === w.id)
        return weekGames.length > 0 && weekGames.every((g) => g.status === GameStatus.Completed && g.home_score != null) && w.net_profit != null
      })
      const totalWon = completedWeeks.filter((w) => w.net_profit! > 0).reduce((sum, w) => sum + w.net_profit!, 0)
      const totalLost = completedWeeks.filter((w) => w.net_profit! < 0).reduce((sum, w) => sum + Math.abs(w.net_profit!), 0)
      const netProfit = completedWeeks.reduce((sum, w) => sum + (w.net_profit ?? 0), 0)
      const totalBet = completedWeeks.length * WEEKLY_STAKE
      const roi = totalBet > 0 ? (netProfit / totalBet) * 100 : 0
      return { total_bet: totalBet, total_won: totalWon, total_lost: totalLost, net_profit: netProfit, roi_percent: roi, total_weeks: completedWeeks.length, total_balance: totalBet + netProfit } satisfies FinancialSummary
    },
  })
}
