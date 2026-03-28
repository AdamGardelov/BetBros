import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek, useUpdateWeekNetProfit } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { WeekHeader } from '../components/week-header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { GameStatus } from '../types'
import { supabase } from '../lib/supabase'
import { gameKindLabel } from '../utils/format'

export function EnterResultsPage() {
  const { user } = useAuth()
  const { data: week } = useCurrentGameWeek()
  const { data: games = [], refetch: refetchGames } = useGames(week?.id)
  const updateNetProfit = useUpdateWeekNetProfit()
  const isSelector = week?.game_selector_id === user?.id
  const allCompleted = games.length > 0 && games.every((g) => g.status === GameStatus.Completed)

  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [netProfit, setNetProfit] = useState(week?.net_profit?.toString() ?? '')
  const [saving, setSaving] = useState<string | null>(null)
  const [profitSaved, setProfitSaved] = useState(false)

  function getScores(gameId: string) { return scores[gameId] ?? { home: '', away: '' } }
  function setGameScore(gameId: string, field: 'home' | 'away', value: string) {
    setScores((prev) => ({ ...prev, [gameId]: { ...getScores(gameId), [field]: value } }))
  }

  async function handleEnterResult(gameId: string) {
    const { home, away } = getScores(gameId)
    if (home === '' || away === '') return
    setSaving(gameId)
    try {
      const { error } = await supabase.functions.invoke('enter-results', {
        body: { game_id: gameId, home_score: parseInt(home), away_score: parseInt(away) },
      })
      if (error) throw error
      await refetchGames()
    } finally { setSaving(null) }
  }

  async function handleSaveNetProfit() {
    if (!week || netProfit === '') return
    await updateNetProfit.mutateAsync({ weekId: week.id, netProfit: parseFloat(netProfit) })
    setProfitSaved(true)
  }

  if (!week) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">Ingen aktiv vecka</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ingen vecka att mata in resultat för.</p>
      </div>
    )
  }

  if (!isSelector) {
    return <p className="text-muted-foreground">Bara veckans väljare kan mata in resultat.</p>
  }

  return (
    <div className="space-y-6">
      {week && <WeekHeader week={week} selector={undefined} />}
      {games.map((game) => {
        const isCompleted = game.status === GameStatus.Completed
        const { home, away } = getScores(game.id)
        return (
          <Card key={game.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {game.home_team} vs {game.away_team}
                <span className="ml-2 text-sm font-normal text-muted-foreground">{gameKindLabel(game.bet_kind)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCompleted ? (
                <p className="font-medium">Resultat: {game.home_score} - {game.away_score}</p>
              ) : (
                <div className="flex items-end gap-2">
                  <div><Label className="text-xs">Hemma</Label><Input type="number" min={0} className="w-16" value={home} onChange={(e) => setGameScore(game.id, 'home', e.target.value)} /></div>
                  <span className="pb-2">-</span>
                  <div><Label className="text-xs">Borta</Label><Input type="number" min={0} className="w-16" value={away} onChange={(e) => setGameScore(game.id, 'away', e.target.value)} /></div>
                  <Button size="sm" disabled={home === '' || away === '' || saving === game.id} onClick={() => handleEnterResult(game.id)}>
                    {saving === game.id ? 'Sparar...' : 'Spara'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      {allCompleted && (
        <Card>
          <CardHeader><CardTitle>Veckoresultat</CardTitle></CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Nettoresultat (kr)</Label>
              <Input type="number" value={netProfit} onChange={(e) => setNetProfit(e.target.value)} placeholder="t.ex. 150 eller -200" />
            </div>
            <Button onClick={handleSaveNetProfit} disabled={netProfit === ''}>
              {profitSaved ? 'Sparat!' : 'Spara resultat'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
