import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { WEEKLY_STAKE } from '../lib/constants'
import type { Bet, BetType, BetStatus } from '../types'

export function useBets(weekId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bets.byWeek(weekId ?? ''),
    queryFn: async () => {
      const { data: games, error: gamesError } = await supabase
        .from('games').select('id').eq('game_week_id', weekId!)
      if (gamesError) throw gamesError
      const gameIds = games.map((g) => g.id)
      if (gameIds.length === 0) return [] as Bet[]
      const { data, error } = await supabase.from('bets').select('*').in('game_id', gameIds)
      if (error) throw error
      return data as Bet[]
    },
    enabled: !!weekId,
  })
}

export function usePlaceBet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ gameId, userId, prediction, predictedHomeScore, predictedAwayScore, gameCount, weekId }: {
      gameId: string; userId: string; prediction: BetType;
      predictedHomeScore?: number | null; predictedAwayScore?: number | null;
      gameCount: number; weekId: string;
    }) => {
      const stake = gameCount > 0 ? WEEKLY_STAKE / gameCount : WEEKLY_STAKE
      const { data, error } = await supabase
        .from('bets')
        .upsert({
          game_id: gameId, user_id: userId, prediction,
          predicted_home_score: predictedHomeScore ?? null,
          predicted_away_score: predictedAwayScore ?? null,
          stake, status: 'pending' as BetStatus,
          placed_at: new Date().toISOString(), scored_at: null,
        }, { onConflict: 'game_id,user_id' })
        .select().single()
      if (error) throw error
      return { bet: data as Bet, weekId }
    },
    onSuccess: ({ weekId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bets.byWeek(weekId) })
    },
  })
}
