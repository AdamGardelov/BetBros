import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames, useCreateGame, useDeleteGame } from '../hooks/use-games'
import { useBets, usePlaceBet } from '../hooks/use-bets'
import { WeekHeader } from '../components/week-header'
import { GameCard } from '../components/game-card'
import { BetPicker } from '../components/bet-picker'
import { TeamAutocomplete } from '../components/team-autocomplete'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { BetType } from '../types'
import type { BetType as BetTypeT } from '../types'
import { MAX_GAMES_PER_WEEK } from '../lib/constants'
import { gameKindLabel } from '../utils/format'

const GAME_KIND_OPTIONS: BetTypeT[] = [
  BetType.HomeWin, BetType.OverOrUnder, BetType.ExactScore, BetType.HomeWinAH, BetType.HomeWinH3W,
]

export function GameSelectionPage() {
  const { user } = useAuth()
  const { data: week } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const createGame = useCreateGame()
  const deleteGame = useDeleteGame()
  const placeBet = usePlaceBet()
  const isSelector = week?.game_selector_id === user?.id

  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [betKind, setBetKind] = useState<BetTypeT>(BetType.HomeWin)
  const [line, setLine] = useState('')

  async function handleCreateGame() {
    if (!week || !homeTeam || !awayTeam) return
    await createGame.mutateAsync({
      game_week_id: week.id, home_team: homeTeam, away_team: awayTeam, bet_kind: betKind,
      over_under_line: betKind === BetType.OverOrUnder ? parseFloat(line) : null,
      asian_handicap_line: betKind === BetType.HomeWinAH ? parseFloat(line) : null,
      handicap_3way_line: betKind === BetType.HomeWinH3W ? parseFloat(line) : null,
    })
    setHomeTeam(''); setAwayTeam(''); setBetKind(BetType.HomeWin); setLine('')
  }

  async function handlePlaceBet(gameId: string, prediction: BetTypeT, homeScore?: number, awayScore?: number) {
    if (!user || !week) return
    await placeBet.mutateAsync({
      gameId, userId: user.id, prediction,
      predictedHomeScore: homeScore ?? null, predictedAwayScore: awayScore ?? null,
      gameCount: games.length, weekId: week.id,
    })
  }

  const needsLine = betKind === BetType.OverOrUnder || betKind === BetType.HomeWinAH || betKind === BetType.HomeWinH3W

  if (!week) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Ingen aktiv vecka</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Veckans matcher har inte skapats ännu. Be admin att skapa en ny vecka.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {week && <WeekHeader week={week} selector={undefined} />}

      {isSelector && games.length < MAX_GAMES_PER_WEEK && (
        <Card>
          <CardHeader><CardTitle>Lägg till match ({games.length}/{MAX_GAMES_PER_WEEK})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hemmalag</Label>
                <TeamAutocomplete value={homeTeam} onChange={setHomeTeam} />
              </div>
              <div className="space-y-2">
                <Label>Bortalag</Label>
                <TeamAutocomplete value={awayTeam} onChange={setAwayTeam} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Speltyp</Label>
                <Select value={betKind} onValueChange={(v) => setBetKind(v as BetTypeT)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GAME_KIND_OPTIONS.map((kind) => (
                      <SelectItem key={kind} value={kind}>{gameKindLabel(kind)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsLine && (
                <div className="space-y-2">
                  <Label>Linje</Label>
                  <Input type="number" step="0.25" value={line} onChange={(e) => setLine(e.target.value)} placeholder="t.ex. 2.5" />
                </div>
              )}
            </div>
            <Button onClick={handleCreateGame} disabled={!homeTeam || !awayTeam || (needsLine && !line)}>Lägg till match</Button>
          </CardContent>
        </Card>
      )}

      {games.map((game) => {
        const myBet = bets.find((b) => b.game_id === game.id && b.user_id === user?.id)
        return (
          <Card key={game.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <GameCard game={game} showScore={false} />
                {isSelector && !bets.some((b) => b.game_id === game.id) && (
                  <Button variant="ghost" size="sm" onClick={() => deleteGame.mutate({ gameId: game.id, weekId: week!.id })}>Ta bort</Button>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Ditt spel:</Label>
                <BetPicker game={game} currentPrediction={myBet?.prediction} onPick={(pred, hs, as_) => handlePlaceBet(game.id, pred, hs, as_)} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
