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
    if (game.over_under_line != null) return `Linje: ${game.over_under_line}`
    if (game.asian_handicap_line != null) return `AH: ${game.asian_handicap_line}`
    if (game.handicap_3way_line != null) return `H3W: ${game.handicap_3way_line}`
    return null
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{game.home_team}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-medium">{game.away_team}</span>
            {showScore && isCompleted && (
              <span className="font-bold">{game.home_score} - {game.away_score}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{gameKindLabel(game.bet_kind)}</span>
            {lineLabel() && <span>{lineLabel()}</span>}
          </div>
        </div>
        {bet && (
          <div className="flex items-center gap-2">
            <span className="text-sm">{betTypeLabel(bet.prediction)}</span>
            {bet.status !== BetStatus.Pending && (
              <Badge
                variant={bet.status === BetStatus.Won ? 'default' : bet.status === BetStatus.Refunded ? 'secondary' : 'destructive'}
                className={cn(bet.status === BetStatus.Won && 'bg-green-600')}
              >
                {betStatusLabel(bet.status)}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
