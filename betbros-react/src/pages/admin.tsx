import { useState } from 'react'
import { useGameWeeks } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert } from '../components/ui/alert'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import { GameStatus } from '../types'
import type { User, GameWeek } from '../types'
import { formatCurrency, gameKindLabel } from '../utils/format'
import { cn } from '../lib/utils'

export function AdminPage() {
  const { data: weeks = [], refetch: refetchWeeks } = useGameWeeks()
  const queryClient = useQueryClient()
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return (data as User[]).sort((a, b) => a.rotation_order - b.rotation_order)
    },
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null)

  async function handleCreateGameWeek() {
    setMessage(null)
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', { body: { type: 'next' } })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: 'Ny vecka skapad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kunde inte skapa vecka' })
    }
  }

  async function handleCreateCancelledWeek() {
    const weekNumber = prompt('Veckonummer att ställa in:')
    if (!weekNumber) return
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', { body: { type: 'cancelled', week_number: parseInt(weekNumber) } })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: `Vecka ${weekNumber} inställd` })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  async function handleCreateCatchupWeek(userId: string) {
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', { body: { type: 'catchup', selector_id: userId } })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: 'Ikappvecka skapad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  async function handleCascadeSelector(weekId: string, selectorId: string) {
    try {
      const { error } = await supabase.functions.invoke('cascade-selector', { body: { week_id: weekId, selector_id: selectorId } })
      if (error) throw error
      await refetchWeeks()
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.all })
      setMessage({ type: 'success', text: 'Väljare uppdaterad med kaskad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  const selectedWeek = weeks.find((w) => w.id === selectedWeekId) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <p className="text-sm">{message.text}</p>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle>Åtgärder</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleCreateGameWeek}>Skapa nästa vecka</Button>
          <Button variant="outline" onClick={handleCreateCancelledWeek}>Ställ in vecka</Button>
          {users.map((u) => (
            <Button key={u.id} variant="outline" onClick={() => handleCreateCatchupWeek(u.id)}>
              Ikappvecka: {u.display_name}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Enter results for any week */}
      <Card>
        <CardHeader><CardTitle>Mata in resultat</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Välj vecka</Label>
            <Select value={selectedWeekId ?? ''} onValueChange={(v) => setSelectedWeekId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj en vecka..." />
              </SelectTrigger>
              <SelectContent>
                {[...weeks].reverse().map((w) => {
                  const sel = users.find((u) => u.id === w.game_selector_id)
                  return (
                    <SelectItem key={w.id} value={w.id}>
                      V{w.week_number} — {sel?.display_name ?? 'Okänd'}
                      {w.is_cancelled && ' (Inställd)'}
                      {w.net_profit != null && ` · ${formatCurrency(w.net_profit)}`}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedWeek && (
            <AdminWeekResults
              week={selectedWeek}
              users={users}
              onMessage={setMessage}
              onRefresh={() => {
                refetchWeeks()
                queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
                queryClient.invalidateQueries({ queryKey: queryKeys.stats.financial })
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Week overview */}
      <Card>
        <CardHeader><CardTitle>Veckor</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeks.map((week) => {
              const selector = users.find((u) => u.id === week.game_selector_id)
              return (
                <div key={week.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{week.is_catchup ? 'Ikapp' : `V${week.week_number}`}</span>
                    <span className="text-sm text-muted-foreground">{selector?.display_name ?? 'Okänd'}</span>
                    {week.is_cancelled && <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inställd</span>}
                    {week.net_profit != null && (
                      <span className={cn('font-data text-xs font-medium', week.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        {formatCurrency(week.net_profit)}
                      </span>
                    )}
                  </div>
                  <Select value={week.game_selector_id} onValueChange={(v) => handleCascadeSelector(week.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.display_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sub-component for managing results of a specific week
function AdminWeekResults({
  week,
  users,
  onMessage,
  onRefresh,
}: {
  week: GameWeek
  users: User[]
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
  onRefresh: () => void
}) {
  const { data: games = [], refetch: refetchGames } = useGames(week.id)
  const selector = users.find((u) => u.id === week.game_selector_id)

  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [netProfit, setNetProfit] = useState(week.net_profit?.toString() ?? '')
  const [saving, setSaving] = useState<string | null>(null)

  function getScores(gameId: string) { return scores[gameId] ?? { home: '', away: '' } }
  function setGameScore(gameId: string, field: 'home' | 'away', value: string) {
    setScores((prev) => ({ ...prev, [gameId]: { ...getScores(gameId), [field]: value } }))
  }

  async function handleEnterResult(gameId: string) {
    const { home, away } = getScores(gameId)
    if (home === '' || away === '') return
    setSaving(gameId)
    try {
      // Admin uses service_role via edge function
      const { error } = await supabase.functions.invoke('enter-results', {
        body: { game_id: gameId, home_score: parseInt(home), away_score: parseInt(away) },
      })
      if (error) throw error
      await refetchGames()
      onMessage({ type: 'success', text: 'Resultat sparat' })
    } catch (err: unknown) {
      onMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kunde inte spara resultat' })
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveNetProfit() {
    if (netProfit === '') return
    try {
      // Admin bypasses RLS via service role - use direct update
      const { error } = await supabase
        .from('game_weeks')
        .update({ net_profit: parseFloat(netProfit), is_complete: true })
        .eq('id', week.id)
      if (error) throw error
      onMessage({ type: 'success', text: `Nettoresultat sparat: ${netProfit} kr` })
      onRefresh()
    } catch (err: unknown) {
      onMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kunde inte spara' })
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Vecka {week.week_number}</h3>
          <p className="text-sm text-muted-foreground">Matchväljare: {selector?.display_name ?? 'Okänd'}</p>
        </div>
        {week.is_cancelled && <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inställd</span>}
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga matcher denna vecka.</p>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const isCompleted = game.status === GameStatus.Completed
            const { home, away } = getScores(game.id)
            return (
              <div key={game.id} className="rounded-lg border border-border/30 bg-card/50 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-semibold text-sm">{game.home_team}</span>
                    <span className="mx-1.5 text-xs text-muted-foreground">vs</span>
                    <span className="font-semibold text-sm">{game.away_team}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{gameKindLabel(game.bet_kind)}</span>
                </div>
                {isCompleted ? (
                  <p className="font-data text-sm">
                    Resultat: <span className="font-bold">{game.home_score} – {game.away_score}</span>
                  </p>
                ) : (
                  <div className="flex items-end gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Hemma</Label>
                      <Input type="number" min={0} className="w-16" value={home}
                        onChange={(e) => setGameScore(game.id, 'home', e.target.value)} />
                    </div>
                    <span className="pb-2 text-muted-foreground">–</span>
                    <div>
                      <Label className="text-xs text-muted-foreground">Borta</Label>
                      <Input type="number" min={0} className="w-16" value={away}
                        onChange={(e) => setGameScore(game.id, 'away', e.target.value)} />
                    </div>
                    <Button size="sm" disabled={home === '' || away === '' || saving === game.id}
                      onClick={() => handleEnterResult(game.id)}>
                      {saving === game.id ? 'Sparar...' : 'Spara'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Net profit - always show for admin */}
      {games.length > 0 && (
        <div className="flex items-end gap-3 border-t border-border/30 pt-4">
          <div className="space-y-2 flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nettoresultat (kr)</Label>
            <Input type="number" value={netProfit}
              onChange={(e) => setNetProfit(e.target.value)}
              placeholder="t.ex. 150 eller -200" />
          </div>
          <Button onClick={handleSaveNetProfit} disabled={netProfit === ''}>
            Spara
          </Button>
        </div>
      )}
    </div>
  )
}
