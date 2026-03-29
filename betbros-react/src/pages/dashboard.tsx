import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { useBets } from '../hooks/use-bets'
import { useLeaderboard } from '../hooks/use-leaderboard'
import { GameCard } from '../components/game-card'
import { StatsCard } from '../components/stats-card'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: week, isLoading: weekLoading } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const { data: leaderboard = [] } = useLeaderboard()

  if (weekLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Laddar...</div>

  const myEntry = leaderboard.find((e) => e.user.id === user?.id)
  const myRank = leaderboard.findIndex((e) => e.user.id === user?.id) + 1
  const isSelector = week?.game_selector_id === user?.id
  const selector = leaderboard.find((e) => e.user.id === week?.game_selector_id)?.user
  const profit = myEntry?.net_profit ?? 0

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Hej, {user?.display_name}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {week ? `Vecka ${week.week_number} · ${isSelector ? 'Du är matchväljare' : `${selector?.display_name ?? '—'} väljer`}` : 'Ingen aktiv vecka just nu'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatsCard
          title="Nettovinst"
          value={formatCurrency(profit)}
          variant={profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'default'}
        />
        <StatsCard
          title="Placering"
          value={myRank > 0 ? `#${myRank}` : '—'}
          variant={myRank === 1 ? 'highlight' : 'default'}
        />
        <StatsCard title="Spel" value={`${myEntry?.total_bets ?? 0}`} />
        <StatsCard title="Träffsäkerhet" value={myEntry ? formatPercent(myEntry.accuracy_percent) : '0%'} />
      </div>

      {/* This week's games */}
      {week && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Veckans matcher</h2>
            {isSelector && (
              <Link to="/valj-matcher">
                <Button size="sm" variant={games.length === 0 ? 'default' : 'outline'} className="text-xs">
                  {games.length === 0 ? 'Välj matcher' : 'Hantera'}
                </Button>
              </Link>
            )}
          </div>
          {games.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isSelector ? 'Du har inte valt matcher ännu' : `${selector?.display_name ?? 'Matchväljaren'} har inte valt matcher ännu`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {games.map((game) => {
                const selectorBet = bets.find((b) => b.game_id === game.id && b.user_id === week?.game_selector_id)
                return <GameCard key={game.id} game={game} bet={selectorBet} />
              })}
            </div>
          )}
        </div>
      )}

      {/* Standings */}
      {leaderboard.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ställning</h2>
            <Link to="/tabell">
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">Visa allt →</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {leaderboard.map((entry, i) => (
                <div key={entry.user.id} className={cn(
                  'flex items-center justify-between px-4 py-3',
                  i < leaderboard.length - 1 && 'border-b border-border/30',
                  entry.user.id === user?.id && 'bg-primary/5',
                )}>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                      i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-accent text-muted-foreground'
                    )}>
                      {i + 1}
                    </span>
                    <span className={cn('text-sm font-medium', entry.user.id === user?.id && 'text-primary')}>
                      {entry.user.display_name}
                    </span>
                  </div>
                  <span className={cn('font-data text-sm font-semibold', entry.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {formatCurrency(entry.net_profit)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
