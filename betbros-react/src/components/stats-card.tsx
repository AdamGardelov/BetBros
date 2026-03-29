import { Card, CardContent } from './ui/card'
import { cn } from '../lib/utils'

interface StatsCardProps {
  title: string
  value: string
  className?: string
  variant?: 'default' | 'positive' | 'negative' | 'highlight'
}

export function StatsCard({ title, value, className, variant = 'default' }: StatsCardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden transition-all',
      variant === 'positive' && 'border-emerald-500/30 glow-emerald',
      variant === 'negative' && 'border-rose-500/30',
      variant === 'highlight' && 'border-amber-500/30 glow-amber',
      className
    )}>
      {variant !== 'default' && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-0.5',
          variant === 'positive' && 'bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0',
          variant === 'negative' && 'bg-gradient-to-r from-rose-500/0 via-rose-500 to-rose-500/0',
          variant === 'highlight' && 'bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0',
        )} />
      )}
      <CardContent className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
        <p className={cn(
          'mt-1.5 text-2xl font-bold font-data',
          variant === 'positive' && 'text-emerald-400',
          variant === 'negative' && 'text-rose-400',
          variant === 'highlight' && 'text-amber-400',
        )}>{value}</p>
      </CardContent>
    </Card>
  )
}
