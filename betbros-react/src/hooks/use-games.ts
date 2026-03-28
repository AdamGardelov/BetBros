import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import type { Game, BetType } from '../types'

export function useGames(weekId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.byWeek(weekId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games').select('*')
        .eq('game_week_id', weekId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Game[]
    },
    enabled: !!weekId,
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (game: {
      game_week_id: string; home_team: string; away_team: string; bet_kind: BetType;
      over_under_line?: number | null; asian_handicap_line?: number | null; handicap_3way_line?: number | null;
    }) => {
      const { data, error } = await supabase.from('games').insert(game).select().single()
      if (error) throw error
      return data as Game
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byWeek(data.game_week_id) })
    },
  })
}

export function useDeleteGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ gameId, weekId }: { gameId: string; weekId: string }) => {
      const { error } = await supabase.from('games').delete().eq('id', gameId)
      if (error) throw error
      return weekId
    },
    onSuccess: (weekId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byWeek(weekId) })
    },
  })
}
