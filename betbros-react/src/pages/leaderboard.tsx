import { useLeaderboard } from '../hooks/use-leaderboard'
import { useAuth } from '../hooks/use-auth'
import { Card, CardContent } from '../components/ui/card'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useLeaderboard()
  const { user } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Laddar...</div>

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Tabell</h1>
      <div className="space-y-3">
        {leaderboard.map((entry, i) => {
          const isMe = entry.user.id === user?.id
          const isLeader = i === 0
          return (
            <Card key={entry.user.id} className={cn(
              'overflow-hidden transition-all',
              isLeader && 'border-amber-500/30 glow-amber',
              isMe && !isLeader && 'border-primary/30',
            )}>
              {isLeader && (
                <div className="h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold',
                      isLeader ? 'bg-amber-500/20 text-amber-400' : 'bg-accent text-muted-foreground'
                    )}>
                      {i + 1}
                    </span>
                    <div>
                      <p className={cn('font-semibold', isMe && 'text-primary', isLeader && 'text-amber-400')}>
                        {entry.user.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total_bets} spel · {formatPercent(entry.accuracy_percent)} träff
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-data text-xl font-bold', entry.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {formatCurrency(entry.net_profit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
