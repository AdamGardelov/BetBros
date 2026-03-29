import type { GameWeek, User } from '../types'
import { formatDate } from '../utils/format'
import { Badge } from './ui/badge'

interface WeekHeaderProps {
  week: GameWeek
  selector: User | undefined
}

export function WeekHeader({ week, selector }: WeekHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="text-lg font-semibold">
        {week.is_catchup ? 'Ikappvecka' : `Vecka ${week.week_number}`}
      </h2>
      {week.is_cancelled && <Badge variant="destructive">Inställd</Badge>}
      {selector && (
        <span className="text-sm text-muted-foreground">Väljare: {selector.display_name}</span>
      )}
      <span className="text-sm text-muted-foreground">
        {formatDate(week.start_date)} — {formatDate(week.end_date)}
      </span>
    </div>
  )
}
