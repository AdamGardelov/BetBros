import { useFinancialStats, useFinancialSummary } from '../hooks/use-stats'
import { StatsCard } from '../components/stats-card'
import { Card, CardContent } from '../components/ui/card'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function StatisticsPage() {
  const { data: financialData, isLoading: statsLoading } = useFinancialStats()
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary()
  if (statsLoading || summaryLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Laddar...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Statistik</h1>

      {/* Summary grid */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatsCard title="Insatsat" value={formatCurrency(summary.total_bet)} />
          <StatsCard title="Vunnet" value={formatCurrency(summary.total_won)} variant="positive" />
          <StatsCard title="Förlorat" value={formatCurrency(summary.total_lost)} variant="negative" />
          <StatsCard
            title="Nettoresultat"
            value={formatCurrency(summary.net_profit)}
            variant={summary.net_profit >= 0 ? 'positive' : 'negative'}
          />
          <StatsCard title="Balans" value={formatCurrency(summary.total_balance)} />
          <StatsCard
            title="ROI"
            value={formatPercent(summary.roi_percent)}
            variant={summary.roi_percent >= 0 ? 'positive' : 'negative'}
          />
          <StatsCard title="Veckor" value={summary.total_weeks.toString()} />
        </div>
      )}

      {/* Per player cards - mobile friendly */}
      {financialData && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Per spelare</h2>
          {financialData.users.map((u) => {
            const s = financialData.stats[u.id]
            if (!s) return null
            return (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{u.display_name}</h3>
                    <span className={cn('font-data text-lg font-bold', s.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {formatCurrency(s.net_profit)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Insatsat</p>
                      <p className="font-data text-sm font-medium">{formatCurrency(s.total_bet)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vunnet</p>
                      <p className="font-data text-sm font-medium text-emerald-400">{formatCurrency(s.total_won)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Förlorat</p>
                      <p className="font-data text-sm font-medium text-rose-400">{formatCurrency(s.total_lost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ROI</p>
                      <p className={cn('font-data text-sm font-medium', s.roi_percent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        {formatPercent(s.roi_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Veckor</p>
                      <p className="font-data text-sm font-medium">{s.weeks_participated}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Matcher</p>
                      <p className="font-data text-sm font-medium">{s.total_games_played}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
