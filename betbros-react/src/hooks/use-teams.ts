import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import type { Team } from '../types'

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('league').order('name')
      if (error) throw error
      return data as Team[]
    },
    staleTime: Infinity,
  })
}
