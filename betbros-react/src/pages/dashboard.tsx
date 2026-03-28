import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { useBets } from '../hooks/use-bets'
import { useLeaderboard } from '../hooks/use-leaderboard'
import { WeekHeader } from '../components/week-header'
import { GameCard } from '../components/game-card'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: week, isLoading: weekLoading } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const { data: leaderboard = [] } = useLeaderboard()

  if (weekLoading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Laddar...</div>

  const myEntry = leaderboard.find((e) => e.user.id === user?.id)
  const myRank = leaderboard.findIndex((e) => e.user.id === user?.id) + 1
  const isSelector = week?.game_selector_id === user?.id
  const selector = leaderboard.find((e) => e.user.id === week?.game_selector_id)?.user

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hej, {user?.display_name}</h1>
        <p className="text-muted-foreground">
          {week ? `Vecka ${week.week_number}` : 'Ingen aktiv vecka just nu'}
        </p>
      </div>

      {week && <WeekHeader week={week} selector={selector} />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className={cn('border-l-4', (myEntry?.net_profit ?? 0) >= 0 ? 'border-l-emerald-500' : 'border-l-red-500')}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nettovinst</p>
            <p className={cn('mt-1 text-2xl font-bold', (myEntry?.net_profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {myEntry ? formatCurrency(myEntry.net_profit) : '0 kr'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Placering</p>
            <p className="mt-1 text-2xl font-bold">{myRank > 0 ? `#${myRank}` : '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Spel</p>
            <p className="mt-1 text-2xl font-bold">{myEntry?.total_bets ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Träffsäkerhet</p>
            <p className="mt-1 text-2xl font-bold">{myEntry ? formatPercent(myEntry.accuracy_percent) : '0%'}</p>
          </CardContent>
        </Card>
      </div>

      {week && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Veckans matcher</CardTitle>
            {isSelector && games.length === 0 && (
              <Link to="/valj-matcher"><Button size="sm">Välj matcher</Button></Link>
            )}
            {isSelector && games.length > 0 && (
              <Link to="/valj-matcher"><Button size="sm" variant="outline">Hantera spel</Button></Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {games.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {isSelector ? 'Du har inte valt matcher ännu.' : `${selector?.display_name ?? 'Matchväljaren'} har inte valt matcher ännu.`}
              </p>
            )}
            {games.map((game) => {
              const selectorBet = bets.find((b) => b.game_id === game.id && b.user_id === week?.game_selector_id)
              return <GameCard key={game.id} game={game} bet={selectorBet} />
            })}
          </CardContent>
        </Card>
      )}

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ställning</CardTitle>
            <Link to="/tabell"><Button size="sm" variant="ghost" className="text-muted-foreground">Visa allt</Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.user.id} className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2',
                  entry.user.id === user?.id && 'bg-accent'
                )}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i === 0 ? '🏆' : i + 1}</span>
                    <span className={cn('text-sm font-medium', entry.user.id === user?.id && 'text-primary')}>
                      {entry.user.display_name}
                    </span>
                  </div>
                  <span className={cn('text-sm font-bold', entry.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(entry.net_profit)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
