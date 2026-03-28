import { useGameWeeks } from '../hooks/use-game-weeks'
import { GameCard } from '../components/game-card'
import { WeekHeader } from '../components/week-header'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { formatCurrency } from '../utils/format'
import { supabase } from '../lib/supabase'
import type { User, Game, Bet } from '../types'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export function HistoryPage() {
  const { data: weeks = [], isLoading } = useGameWeeks()
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return data as User[]
    },
  })
  const { data: allGames = [] } = useQuery({
    queryKey: ['all-games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('created_at')
      if (error) throw error
      return data as Game[]
    },
  })
  const { data: allBets = [] } = useQuery({
    queryKey: ['all-bets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bets').select('*')
      if (error) throw error
      return data as Bet[]
    },
  })

  if (isLoading) return <div>Laddar...</div>

  const sortedWeeks = [...weeks].reverse()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historik</h1>
      <Accordion type="single" collapsible>
        {sortedWeeks.map((week) => {
          const weekGames = allGames.filter((g) => g.game_week_id === week.id)
          const selector = users.find((u) => u.id === week.game_selector_id)
          return (
            <AccordionItem key={week.id} value={week.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <WeekHeader week={week} selector={selector} />
                  {week.net_profit != null && (
                    <span className={week.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(week.net_profit)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-4">
                  {weekGames.map((game) => (
                    <div key={game.id} className="space-y-2">
                      <GameCard game={game} />
                      <div className="grid grid-cols-2 gap-2 pl-4 md:grid-cols-4">
                        {users.map((u) => {
                          const bet = allBets.find((b) => b.game_id === game.id && b.user_id === u.id)
                          if (!bet) return (
                            <div key={u.id} className="text-sm">
                              <span className="font-medium">{u.display_name}:</span>{' '}
                              <span className="text-muted-foreground">Inget spel</span>
                            </div>
                          )
                          return (
                            <div key={u.id} className="text-sm">
                              <span className="font-medium">{u.display_name}:</span>{' '}
                              <GameCard game={game} bet={bet} showScore={false} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {weekGames.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {week.is_cancelled ? 'Inställd vecka' : 'Inga matcher'}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
