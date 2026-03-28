import type { Game, Bet } from '../types'
import { BetStatus, GameStatus } from '../types'
import { betTypeLabel, betStatusLabel, gameKindLabel } from '../utils/format'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

interface GameCardProps {
  game: Game
  bet?: Bet
  showScore?: boolean
}

export function GameCard({ game, bet, showScore = true }: GameCardProps) {
  const isCompleted = game.status === GameStatus.Completed

  function lineLabel(): string | null {
    if (game.over_under_line != null) return `${game.over_under_line}`
    if (game.asian_handicap_line != null) return `${game.asian_handicap_line}`
    if (game.handicap_3way_line != null) return `${game.handicap_3way_line}`
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Row 1: Teams + score */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-medium">{game.home_team}</span>
            <span className="mx-1.5 text-xs text-muted-foreground">vs</span>
            <span className="font-medium">{game.away_team}</span>
          </div>
          {showScore && isCompleted && (
            <span className="shrink-0 rounded bg-accent px-2 py-0.5 text-sm font-bold tabular-nums">
              {game.home_score} - {game.away_score}
            </span>
          )}
        </div>

        {/* Row 2: Bet type + line + prediction */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{gameKindLabel(game.bet_kind)}</span>
            {lineLabel() && (
              <span className="rounded bg-accent/50 px-1.5 py-0.5">{lineLabel()}</span>
            )}
          </div>
          {bet && (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{betTypeLabel(bet.prediction)}</span>
              {bet.status !== BetStatus.Pending && (
                <Badge
                  variant={bet.status === BetStatus.Won ? 'default' : bet.status === BetStatus.Refunded ? 'secondary' : 'destructive'}
                  className={cn('text-[10px] px-1.5 py-0', bet.status === BetStatus.Won && 'bg-emerald-600')}
                >
                  {betStatusLabel(bet.status)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
