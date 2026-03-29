import { useState } from 'react'
import type { BetType as BetTypeT } from '../types'
import { BetType } from '../types'
import type { Game } from '../types'
import { getPredictionOptions } from '../lib/bet-validation'
import { betTypeLabel } from '../utils/format'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { cn } from '../lib/utils'

interface BetPickerProps {
  game: Game
  currentPrediction?: BetTypeT
  onPick: (prediction: BetTypeT, homeScore?: number, awayScore?: number) => void
}

export function BetPicker({ game, currentPrediction, onPick }: BetPickerProps) {
  const options = getPredictionOptions(game.bet_kind)
  const [homeScore, setHomeScore] = useState<string>('')
  const [awayScore, setAwayScore] = useState<string>('')

  if (game.bet_kind === BetType.ExactScore) {
    return (
      <div className="flex items-end gap-2">
        <div>
          <Label className="text-xs">{game.home_team}</Label>
          <Input type="number" min={0} className="w-16" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
        </div>
        <span className="pb-2">-</span>
        <div>
          <Label className="text-xs">{game.away_team}</Label>
          <Input type="number" min={0} className="w-16" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
        </div>
        <Button size="sm" disabled={homeScore === '' || awayScore === ''}
          onClick={() => onPick(BetType.ExactScore, parseInt(homeScore), parseInt(awayScore))}>
          Spela
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <Button key={option} size="sm"
          variant={currentPrediction === option ? 'default' : 'outline'}
          className={cn(currentPrediction === option && 'bg-primary')}
          onClick={() => onPick(option)}>
          {betTypeLabel(option)}
        </Button>
      ))}
    </div>
  )
}
