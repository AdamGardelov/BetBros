import type { Game, Bet } from '../types'
import { BetStatus, GameStatus } from '../types'
import { betTypeLabel, betStatusLabel, gameKindLabel } from '../utils/format'
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
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 transition-colors hover:bg-card/80">
      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-semibold">{game.home_team}</span>
          <span className="mx-2 text-xs text-muted-foreground">vs</span>
          <span className="font-semibold">{game.away_team}</span>
        </div>
        {showScore && isCompleted && (
          <div className="shrink-0 rounded-lg bg-accent/80 px-3 py-1">
            <span className="font-data text-sm font-bold">{game.home_score} – {game.away_score}</span>
          </div>
        )}
      </div>

      {/* Meta + bet */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">{gameKindLabel(game.bet_kind)}</span>
          {lineLabel() && (
            <span className="rounded-md bg-accent/60 px-1.5 py-0.5 font-data text-[11px] text-muted-foreground">{lineLabel()}</span>
          )}
        </div>
        {bet && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="font-data text-xs text-muted-foreground">{betTypeLabel(bet.prediction)}</span>
            {bet.status !== BetStatus.Pending && (
              <Badge
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-semibold',
                  bet.status === BetStatus.Won && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  bet.status === BetStatus.Lost && 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                  bet.status === BetStatus.Refunded && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                )}
              >
                {betStatusLabel(bet.status)}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
