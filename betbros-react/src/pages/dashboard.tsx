import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { useBets } from '../hooks/use-bets'
import { useLeaderboard } from '../hooks/use-leaderboard'
import { WeekHeader } from '../components/week-header'
import { GameCard } from '../components/game-card'
import { StatsCard } from '../components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatCurrency } from '../utils/format'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: week, isLoading: weekLoading } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const { data: leaderboard = [] } = useLeaderboard()

  if (weekLoading) return <div>Laddar...</div>

  const myEntry = leaderboard.find((e) => e.user.id === user?.id)
  const myRank = leaderboard.findIndex((e) => e.user.id === user?.id) + 1
  const isSelector = week?.game_selector_id === user?.id
  const selector = leaderboard.find((e) => e.user.id === week?.game_selector_id)?.user

  return (
    <div className="space-y-6">
      {week && <WeekHeader week={week} selector={selector} />}
      {!week && <p className="text-muted-foreground">Ingen aktiv vecka</p>}

      <div className="grid grid-cols-2 gap-4">
        <StatsCard title="Din nettovinst" value={myEntry ? formatCurrency(myEntry.net_profit) : '0 kr'} />
        <StatsCard title="Placering" value={myRank > 0 ? `#${myRank}` : '-'} />
      </div>

      {week && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Matcher</CardTitle>
            {isSelector && games.length === 0 && (
              <Link to="/valj-matcher"><Button size="sm">Välj matcher</Button></Link>
            )}
            {games.length > 0 && (
              <Link to="/valj-matcher"><Button size="sm" variant="outline">Lägg spel</Button></Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {games.length === 0 && <p className="text-sm text-muted-foreground">Inga matcher valda ännu.</p>}
            {games.map((game) => {
              const myBet = bets.find((b) => b.game_id === game.id && b.user_id === user?.id)
              return <GameCard key={game.id} game={game} bet={myBet} />
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
