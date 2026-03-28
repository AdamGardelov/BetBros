import { useLeaderboard } from '../hooks/use-leaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useLeaderboard()
  if (isLoading) return <div>Laddar...</div>

  return (
    <Card>
      <CardHeader><CardTitle>Tabell</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Spelare</TableHead>
              <TableHead className="text-right">Vinst</TableHead>
              <TableHead className="text-right">Spel</TableHead>
              <TableHead className="text-right">Träff%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((entry, i) => (
              <TableRow key={entry.user.id}>
                <TableCell className="font-medium">{i === 0 ? '🏆' : i + 1}</TableCell>
                <TableCell>{entry.user.display_name}</TableCell>
                <TableCell className={cn('text-right font-medium', entry.net_profit > 0 && 'text-green-600', entry.net_profit < 0 && 'text-red-600')}>
                  {formatCurrency(entry.net_profit)}
                </TableCell>
                <TableCell className="text-right">{entry.total_bets}</TableCell>
                <TableCell className="text-right">{formatPercent(entry.accuracy_percent)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
