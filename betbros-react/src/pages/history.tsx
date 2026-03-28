import { useState } from 'react'
import { useGameWeeks } from '../hooks/use-game-weeks'
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

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Laddar...</div>

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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Historik</h1>
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger className="w-44 border-border/50 bg-card">
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

      {filteredWeeks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">Ingen historik att visa</p>
        </div>
      )}

      <Accordion type="single" collapsible className="space-y-2">
        {filteredWeeks.map((week) => {
          const weekGames = allGames.filter((g) => g.game_week_id === week.id)
          const selector = users.find((u) => u.id === week.game_selector_id)
          const weekBets = allBets.filter((b) => weekGames.some((g) => g.id === b.game_id) && b.user_id === week.game_selector_id)
          const wins = weekBets.filter((b) => b.status === BetStatus.Won || b.status === BetStatus.Refunded).length
          const losses = weekBets.filter((b) => b.status === BetStatus.Lost).length
          const profit = week.net_profit ?? 0

          return (
            <AccordionItem key={week.id} value={week.id} className="rounded-lg border border-border/50 bg-card/50 px-4">
              <AccordionTrigger className="py-3 text-left hover:no-underline [&[data-state=open]]:pb-2">
                <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 pr-2">
                  <span className="font-bold">V{week.week_number}</span>
                  {selector && (
                    <span className="text-sm text-muted-foreground">{selector.display_name}</span>
                  )}
                  {weekBets.length > 0 && (
                    <span className="font-data text-xs text-muted-foreground">
                      <span className="text-emerald-400">{wins}W</span>
                      {' '}
                      <span className="text-rose-400">{losses}L</span>
                    </span>
                  )}
                  {week.net_profit != null && (
                    <span className={cn(
                      'ml-auto font-data text-sm font-bold',
                      profit >= 0 ? 'text-emerald-400' : 'text-rose-400',
                    )}>
                      {formatCurrency(profit)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-1">
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
                        <div key={game.id} className="rounded-lg border border-border/30 bg-background/50 px-3 py-2.5">
                          {/* Row 1: Teams + score */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-sm font-semibold">{game.home_team}</span>
                              <span className="mx-1 text-xs text-muted-foreground">vs</span>
                              <span className="text-sm font-semibold">{game.away_team}</span>
                            </div>
                            {isCompleted && (
                              <span className="shrink-0 font-data rounded bg-accent px-2 py-0.5 text-xs font-bold">
                                {game.home_score}–{game.away_score}
                              </span>
                            )}
                          </div>
                          {/* Row 2: Type + bet + result */}
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span>{gameKindLabel(game.bet_kind)}</span>
                              {line && <span className="rounded bg-accent px-1.5 py-0.5 font-data">{line}</span>}
                            </div>
                            {bet && (
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span className="font-data text-xs text-muted-foreground">
                                  {bet.prediction === 'exact_score' && bet.predicted_home_score != null
                                    ? `${bet.predicted_home_score}–${bet.predicted_away_score}`
                                    : betTypeLabel(bet.prediction)}
                                </span>
                                {bet.status !== BetStatus.Pending && (
                                  <span className={cn(
                                    'text-[10px] font-semibold',
                                    bet.status === BetStatus.Won && 'text-emerald-400',
                                    bet.status === BetStatus.Lost && 'text-rose-400',
                                    bet.status === BetStatus.Refunded && 'text-amber-400',
                                  )}>
                                    {bet.status === BetStatus.Won ? '✓' : bet.status === BetStatus.Lost ? '✗' : '—'}
                                  </span>
                                )}
                              </div>
                            )}
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
