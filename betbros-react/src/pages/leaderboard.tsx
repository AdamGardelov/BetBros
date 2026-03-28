import { useLeaderboard } from '../hooks/use-leaderboard'
import { useAuth } from '../hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useLeaderboard()
  const { user } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Laddar...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tabell</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Spelare</TableHead>
                <TableHead className="text-right">Vinst</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Spel</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Träff%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, i) => (
                <TableRow key={entry.user.id} className={cn(
                  'border-border/50',
                  entry.user.id === user?.id && 'bg-accent/50',
                  i === 0 && 'bg-primary/5'
                )}>
                  <TableCell className="font-bold">{i === 0 ? '🏆' : i + 1}</TableCell>
                  <TableCell className={cn('font-medium', i === 0 && 'text-primary')}>{entry.user.display_name}</TableCell>
                  <TableCell className={cn('text-right font-bold tabular-nums', entry.net_profit > 0 ? 'text-emerald-400' : entry.net_profit < 0 ? 'text-red-400' : '')}>
                    {formatCurrency(entry.net_profit)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{entry.total_bets}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatPercent(entry.accuracy_percent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
