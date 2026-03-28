import { useState } from 'react'
import { useGameWeeks } from '../hooks/use-game-weeks'
import { WeekHeader } from '../components/week-header'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { formatCurrency, betTypeLabel, betStatusLabel, gameKindLabel } from '../utils/format'
import { supabase } from '../lib/supabase'
import { BetStatus, GameStatus } from '../types'
import type { User, Game, Bet } from '../types'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import { cn } from '../lib/utils'

export function HistoryPage() {
  const { data: weeks = [], isLoading } = useGameWeeks()
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return (data as User[]).sort((a, b) => a.rotation_order - b.rotation_order)
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

  const [filterPlayer, setFilterPlayer] = useState<string>('all')

  if (isLoading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Laddar...</div>

  const sortedWeeks = [...weeks].reverse()

  function lineLabel(game: Game): string | null {
    if (game.over_under_line != null) return `${game.over_under_line}`
    if (game.asian_handicap_line != null) return `${game.asian_handicap_line}`
    if (game.handicap_3way_line != null) return `${game.handicap_3way_line}`
    return null
  }

  // Filter weeks by player (selector)
  const filteredWeeks = filterPlayer === 'all'
    ? sortedWeeks
    : sortedWeeks.filter((w) => w.game_selector_id === filterPlayer)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Historik</h1>
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alla spelare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla spelare</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Accordion type="single" collapsible>
        {filteredWeeks.map((week) => {
          const weekGames = allGames.filter((g) => g.game_week_id === week.id)
          const selector = users.find((u) => u.id === week.game_selector_id)
          const weekBets = allBets.filter((b) => weekGames.some((g) => g.id === b.game_id) && b.user_id === week.game_selector_id)
          const wins = weekBets.filter((b) => b.status === BetStatus.Won || b.status === BetStatus.Refunded).length
          const losses = weekBets.filter((b) => b.status === BetStatus.Lost).length

          return (
            <AccordionItem key={week.id} value={week.id} className="border-border/50">
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                  <WeekHeader week={week} selector={selector} />
                  {weekBets.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {wins}W {losses}L
                    </span>
                  )}
                  {week.net_profit != null && (
                    <span className={cn('font-bold tabular-nums', week.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {formatCurrency(week.net_profit)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {week.is_cancelled ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Inställd vecka</p>
                  ) : weekGames.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Inga matcher</p>
                  ) : (
                    weekGames.map((game) => {
                      const isCompleted = game.status === GameStatus.Completed
                      const line = lineLabel(game)
                      const bet = allBets.find((b) => b.game_id === game.id && b.user_id === week.game_selector_id)

                      return (
                        <div key={game.id} className="rounded-lg border border-border/50 bg-card/50 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{game.home_team}</span>
                              <span className="text-xs text-muted-foreground">vs</span>
                              <span className="font-semibold">{game.away_team}</span>
                              {isCompleted && (
                                <span className="rounded bg-accent px-2 py-0.5 text-sm font-bold tabular-nums">
                                  {game.home_score} - {game.away_score}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {bet && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {bet.prediction === 'exact_score' && bet.predicted_home_score != null
                                      ? `${bet.predicted_home_score}-${bet.predicted_away_score}`
                                      : betTypeLabel(bet.prediction)}
                                  </span>
                                  {bet.status !== BetStatus.Pending && (
                                    <Badge
                                      variant={bet.status === BetStatus.Won ? 'default' : bet.status === BetStatus.Refunded ? 'secondary' : 'destructive'}
                                      className={cn('text-xs', bet.status === BetStatus.Won && 'bg-emerald-600')}
                                    >
                                      {betStatusLabel(bet.status)}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{gameKindLabel(game.bet_kind)}</span>
                                {line && <span className="rounded bg-accent px-1.5 py-0.5">{line}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
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
