import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { getCurrentWeekNumber } from '../lib/rotation'
import { BASE_DATE } from '../lib/constants'
import type { GameWeek } from '../types'

export function useGameWeeks() {
  return useQuery({
    queryKey: queryKeys.gameWeeks.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_weeks').select('*')
        .order('is_catchup', { ascending: true })
        .order('week_number', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as GameWeek[]
    },
  })
}

export function useCurrentGameWeek() {
  const weekNumber = getCurrentWeekNumber(BASE_DATE)
  return useQuery({
    queryKey: queryKeys.gameWeeks.current,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_weeks').select('*')
        .eq('week_number', weekNumber)
        .eq('is_catchup', false)
        .maybeSingle()
      if (error) throw error
      return data as GameWeek | null
    },
  })
}

export function useUpdateWeekNetProfit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ weekId, netProfit }: { weekId: string; netProfit: number | null }) => {
      const { data, error } = await supabase
        .from('game_weeks')
        .update({ net_profit: netProfit, is_complete: netProfit != null })
        .eq('id', weekId).select().single()
      if (error) throw error
      return data as GameWeek
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.current })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.financial })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
    },
  })
}
