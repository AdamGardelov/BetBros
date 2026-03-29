import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames, useCreateGame, useDeleteGame } from '../hooks/use-games'
import { useBets, usePlaceBet } from '../hooks/use-bets'
import { WeekHeader } from '../components/week-header'
import { TeamAutocomplete } from '../components/team-autocomplete'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { BetType } from '../types'
import type { BetType as BetTypeT, Game } from '../types'
import { MAX_GAMES_PER_WEEK } from '../lib/constants'
import { gameKindLabel, betTypeLabel } from '../utils/format'
import { getPredictionOptions } from '../lib/bet-validation'
import { cn } from '../lib/utils'

const GAME_KIND_OPTIONS: { value: BetTypeT; label: string; desc: string }[] = [
  { value: BetType.HomeWin, label: '1X2', desc: 'Hemmavinst, Oavgjort, Bortavinst' },
  { value: BetType.OverOrUnder, label: 'Över/Under', desc: 'Antal mål över eller under linje' },
  { value: BetType.ExactScore, label: 'Exakt Resultat', desc: 'Gissa exakt slutresultat' },
  { value: BetType.HomeWinAH, label: 'Asian Handicap', desc: 'Handicap med halv-/kvartlinjer' },
  { value: BetType.HomeWinH3W, label: 'Handicap 3-vägs', desc: 'Europeiskt handicap med oavgjort' },
]

// Bet option labels matching the original app
const BET_LABELS: Record<string, string> = {
  home_win: '1 (Hemma)',
  draw: 'X (Oavgjort)',
  away_win: '2 (Borta)',
  home_win_to_nil: '1 + håller nollan',
  away_win_to_nil: '2 + håller nollan',
  home_win_dnb: '1 (DNB)',
  away_win_dnb: '2 (DNB)',
  over: 'Över',
  under: 'Under',
  home_win_ah: '1 (Hemma)',
  away_win_ah: '2 (Borta)',
  home_win_h3w: '1 (Hemma)',
  draw_h3w: 'X (Oavgjort)',
  away_win_h3w: '2 (Borta)',
}

export function GameSelectionPage() {
  const { user } = useAuth()
  const { data: week } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const createGame = useCreateGame()
  const deleteGame = useDeleteGame()
  const placeBet = usePlaceBet()
  const isSelector = week?.game_selector_id === user?.id

  // Two-step state
  const hasBets = bets.some((b) => b.user_id === user?.id)
  const [selectionDone, setSelectionDone] = useState(hasBets || games.length >= MAX_GAMES_PER_WEEK)

  // Game form
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [betKind, setBetKind] = useState<BetTypeT>(BetType.HomeWin)
  const [line, setLine] = useState('')

  // Bet form (temp predictions before submitting)
  const [tempBets, setTempBets] = useState<Record<string, BetTypeT>>({})
  const [tempScores, setTempScores] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState(false)

  if (!week) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">Ingen aktiv vecka</h2>
        <p className="mt-2 text-sm text-muted-foreground">Veckans matcher har inte skapats ännu.</p>
      </div>
    )
  }

  if (!isSelector) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">Du har inte behörighet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Du väljer inte matcher denna vecka.</p>
      </div>
    )
  }

  const needsLine = betKind === BetType.OverOrUnder || betKind === BetType.HomeWinAH || betKind === BetType.HomeWinH3W
  const showStep1 = !selectionDone && games.length < MAX_GAMES_PER_WEEK
  const showStep2 = selectionDone || games.length >= MAX_GAMES_PER_WEEK

  async function handleCreateGame() {
    if (!week || !homeTeam || !awayTeam) return
    await createGame.mutateAsync({
      game_week_id: week.id, home_team: homeTeam, away_team: awayTeam, bet_kind: betKind,
      over_under_line: betKind === BetType.OverOrUnder ? parseFloat(line) : null,
      asian_handicap_line: betKind === BetType.HomeWinAH ? parseFloat(line) : null,
      handicap_3way_line: betKind === BetType.HomeWinH3W ? parseFloat(line) : null,
    })
    setHomeTeam(''); setAwayTeam(''); setBetKind(BetType.HomeWin); setLine('')
    // Auto-advance to step 2 at max games
    if (games.length + 1 >= MAX_GAMES_PER_WEEK) setSelectionDone(true)
  }

  function setPrediction(gameId: string, prediction: BetTypeT) {
    setTempBets((prev) => ({ ...prev, [gameId]: prediction }))
  }

  function setScore(gameId: string, field: 'home' | 'away', value: string) {
    setTempScores((prev) => ({
      ...prev,
      [gameId]: { ...(prev[gameId] ?? { home: '', away: '' }), [field]: value },
    }))
  }

  function canSubmitAll(): boolean {
    return games.every((game) => {
      if (game.bet_kind === BetType.ExactScore) {
        const s = tempScores[game.id]
        return s && s.home !== '' && s.away !== ''
      }
      return !!tempBets[game.id]
    })
  }

  async function handleSubmitAllBets() {
    if (!user || !week || saving) return
    setSaving(true)
    try {
      for (const game of games) {
        if (game.bet_kind === BetType.ExactScore) {
          const s = tempScores[game.id]
          await placeBet.mutateAsync({
            gameId: game.id, userId: user.id, prediction: BetType.ExactScore,
            predictedHomeScore: parseInt(s.home), predictedAwayScore: parseInt(s.away),
            gameCount: games.length, weekId: week.id,
          })
        } else {
          await placeBet.mutateAsync({
            gameId: game.id, userId: user.id, prediction: tempBets[game.id],
            gameCount: games.length, weekId: week.id,
          })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  function lineLabel(game: Game): string {
    if (game.over_under_line != null) return `${game.over_under_line} mål`
    if (game.asian_handicap_line != null) return `Linje: ${game.asian_handicap_line}`
    if (game.handicap_3way_line != null) return `Linje: ${game.handicap_3way_line}`
    return ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Välj Matcher & Lägg Spel</h1>
        <p className="text-muted-foreground">Vecka {week.week_number} — Du är matchväljare</p>
      </div>

      <WeekHeader week={week} selector={undefined} />

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        <div className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          !showStep2 ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
        )}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs font-bold">1</span>
          Välj matcher
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          showStep2 ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
        )}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs font-bold">2</span>
          Lägg spel
        </div>
      </div>

      {/* STEP 1: Pick games */}
      {showStep1 && (
        <>
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="space-y-5 p-6">
              <p className="text-sm text-muted-foreground">
                Välj 1–3 matcher ({games.length} av {MAX_GAMES_PER_WEEK} valda)
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hemmalag</Label>
                  <TeamAutocomplete value={homeTeam} onChange={setHomeTeam} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bortalag</Label>
                  <TeamAutocomplete value={awayTeam} onChange={setAwayTeam} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Speltyp</Label>
                  <Select value={betKind} onValueChange={(v) => setBetKind(v as BetTypeT)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GAME_KIND_OPTIONS.map(({ value, label, desc }) => (
                        <SelectItem key={value} value={value}>
                          <span className="font-medium">{label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {needsLine && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      {betKind === BetType.OverOrUnder ? 'Mållinje' : 'Handicaplinje'}
                    </Label>
                    <Input
                      type="number"
                      step={betKind === BetType.HomeWinH3W ? '1' : '0.25'}
                      value={line}
                      onChange={(e) => setLine(e.target.value)}
                      placeholder={betKind === BetType.OverOrUnder ? 't.ex. 2.5' : 't.ex. -1.5'}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateGame}
                disabled={!homeTeam || !awayTeam || (needsLine && !line)}
                className="w-full sm:w-auto"
              >
                Lägg till match ({games.length + 1}/{MAX_GAMES_PER_WEEK})
              </Button>
            </CardContent>
          </Card>

          {/* Selected games list */}
          {games.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Valda matcher</h3>
              {games.map((game) => (
                <div key={game.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3">
                  <div>
                    <span className="font-semibold">{game.home_team}</span>
                    <span className="mx-2 text-xs text-muted-foreground">vs</span>
                    <span className="font-semibold">{game.away_team}</span>
                    <Badge variant="secondary" className="ml-3 text-xs">{gameKindLabel(game.bet_kind)}</Badge>
                    {lineLabel(game) && (
                      <span className="ml-2 text-xs text-muted-foreground">{lineLabel(game)}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteGame.mutate({ gameId: game.id, weekId: week.id })}
                  >
                    Ta bort
                  </Button>
                </div>
              ))}

              <Button
                onClick={() => setSelectionDone(true)}
                className="mt-4 w-full"
                size="lg"
              >
                Klar med matchval ({games.length} {games.length === 1 ? 'match vald' : 'matcher valda'})
              </Button>
            </div>
          )}
        </>
      )}

      {/* STEP 2: Place bets */}
      {showStep2 && games.length > 0 && (
        <>
          {games.length < MAX_GAMES_PER_WEEK && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionDone(false)}
            >
              Lägg till fler matcher ({games.length}/{MAX_GAMES_PER_WEEK})
            </Button>
          )}

          <div className="space-y-4">
            {games.map((game) => {
              const options = getPredictionOptions(game.bet_kind)
              const existingBet = bets.find((b) => b.game_id === game.id && b.user_id === user?.id)
              const currentPick = tempBets[game.id] ?? existingBet?.prediction
              const scores = tempScores[game.id] ?? { home: '', away: '' }

              return (
                <Card key={game.id} className="overflow-hidden border-border/50">
                  {/* Game header bar */}
                  <div className="flex items-center justify-between border-b border-border/30 bg-accent/30 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{game.home_team}</span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span className="font-semibold">{game.away_team}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{gameKindLabel(game.bet_kind)}</Badge>
                      {lineLabel(game) && <span>{lineLabel(game)}</span>}
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {game.bet_kind === BetType.ExactScore ? (
                      /* Exact score input */
                      <div>
                        <p className="mb-3 text-sm font-medium">Ange exakt resultat</p>
                        <div className="flex items-end gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{game.home_team}</Label>
                            <Input
                              type="number"
                              min={0}
                              className="w-20 text-center text-lg font-bold"
                              value={scores.home}
                              onChange={(e) => setScore(game.id, 'home', e.target.value)}
                            />
                          </div>
                          <span className="pb-3 text-xl font-light text-muted-foreground">–</span>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{game.away_team}</Label>
                            <Input
                              type="number"
                              min={0}
                              className="w-20 text-center text-lg font-bold"
                              value={scores.away}
                              onChange={(e) => setScore(game.id, 'away', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Button grid for predictions */
                      <div>
                        <p className="mb-3 text-sm font-medium">
                          {game.bet_kind === BetType.OverOrUnder
                            ? `Över/Under ${game.over_under_line} mål`
                            : 'Välj ditt spel'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {options.map((option) => (
                            <button
                              key={option}
                              onClick={() => setPrediction(game.id, option)}
                              className={cn(
                                'rounded-lg border px-3 py-3 text-sm font-medium transition-all',
                                currentPick === option
                                  ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                  : 'border-border/50 bg-accent/20 text-foreground hover:border-primary/50 hover:bg-accent/40'
                              )}
                            >
                              {BET_LABELS[option] ?? betTypeLabel(option)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current selection indicator */}
                    {currentPick && game.bet_kind !== BetType.ExactScore && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Ditt val:</span>
                        <Badge className="bg-primary/20 text-primary">{BET_LABELS[currentPick] ?? betTypeLabel(currentPick)}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Submit all bets */}
          <Button
            onClick={handleSubmitAllBets}
            disabled={!canSubmitAll() || saving}
            size="lg"
            className="w-full"
          >
            {saving ? 'Sparar...' : 'Spara Alla Spel'}
          </Button>
        </>
      )}
    </div>
  )
}
