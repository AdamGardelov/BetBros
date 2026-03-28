import { useFinancialStats, useFinancialSummary } from '../hooks/use-stats'
import { StatsCard } from '../components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function StatisticsPage() {
  const { data: financialData, isLoading: statsLoading } = useFinancialStats()
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary()
  if (statsLoading || summaryLoading) return <div>Laddar...</div>

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatsCard title="Totalt insatsat" value={formatCurrency(summary.total_bet)} />
          <StatsCard title="Totalt vunnet" value={formatCurrency(summary.total_won)} />
          <StatsCard title="Totalt förlorat" value={formatCurrency(summary.total_lost)} />
          <StatsCard title="Nettoresultat" value={formatCurrency(summary.net_profit)} className={cn(summary.net_profit >= 0 ? 'border-green-200' : 'border-red-200')} />
          <StatsCard title="Total balans" value={formatCurrency(summary.total_balance)} />
          <StatsCard title="ROI" value={formatPercent(summary.roi_percent)} />
          <StatsCard title="Veckor" value={summary.total_weeks.toString()} />
        </div>
      )}
      {financialData && (
        <Card>
          <CardHeader><CardTitle>Per spelare</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spelare</TableHead>
                  <TableHead className="text-right">Insatsat</TableHead>
                  <TableHead className="text-right">Vunnet</TableHead>
                  <TableHead className="text-right">Förlorat</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Veckor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialData.users.map((user) => {
                  const s = financialData.stats[user.id]
                  if (!s) return null
                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.display_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.total_bet)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.total_won)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.total_lost)}</TableCell>
                      <TableCell className={cn('text-right font-medium', s.net_profit > 0 && 'text-green-600', s.net_profit < 0 && 'text-red-600')}>{formatCurrency(s.net_profit)}</TableCell>
                      <TableCell className="text-right">{formatPercent(s.roi_percent)}</TableCell>
                      <TableCell className="text-right">{s.weeks_participated}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
