import { BetType, BetStatus, GameStatus } from '../types'
import type { Bet, Game } from '../types'

export function scoreBet(bet: Bet, game: Game): BetStatus {
  if (game.status !== GameStatus.Completed || game.home_score == null || game.away_score == null) {
    return BetStatus.Pending
  }

  const { home_score, away_score } = game

  // Exact Score
  if (bet.prediction === BetType.ExactScore) {
    if (bet.predicted_home_score == null || bet.predicted_away_score == null) {
      return BetStatus.Pending
    }
    return bet.predicted_home_score === home_score && bet.predicted_away_score === away_score
      ? BetStatus.Won : BetStatus.Lost
  }

  // Win to Nil
  if (bet.prediction === BetType.HomeWinToNil) {
    return home_score > away_score && away_score === 0 ? BetStatus.Won : BetStatus.Lost
  }
  if (bet.prediction === BetType.AwayWinToNil) {
    return away_score > home_score && home_score === 0 ? BetStatus.Won : BetStatus.Lost
  }

  // Draw No Bet
  if (bet.prediction === BetType.HomeWinDNB) {
    if (home_score === away_score) return BetStatus.Refunded
    return home_score > away_score ? BetStatus.Won : BetStatus.Lost
  }
  if (bet.prediction === BetType.AwayWinDNB) {
    if (home_score === away_score) return BetStatus.Refunded
    return away_score > home_score ? BetStatus.Won : BetStatus.Lost
  }

  // Asian Handicap
  if (bet.prediction === BetType.HomeWinAH || bet.prediction === BetType.AwayWinAH) {
    return scoreAsianHandicap(bet, game)
  }

  // Handicap 3-Way
  if (bet.prediction === BetType.HomeWinH3W || bet.prediction === BetType.DrawH3W || bet.prediction === BetType.AwayWinH3W) {
    return scoreHandicap3Way(bet, game)
  }

  // Over/Under
  if (bet.prediction === BetType.Over || bet.prediction === BetType.Under) {
    if (game.over_under_line == null) return BetStatus.Pending
    const totalGoals = home_score + away_score
    const actualResult = totalGoals > game.over_under_line ? BetType.Over : BetType.Under
    return bet.prediction === actualResult ? BetStatus.Won : BetStatus.Lost
  }

  // 1/X/2
  if (bet.prediction === BetType.HomeWin) {
    return home_score > away_score ? BetStatus.Won : BetStatus.Lost
  }
  if (bet.prediction === BetType.AwayWin) {
    return away_score > home_score ? BetStatus.Won : BetStatus.Lost
  }
  if (bet.prediction === BetType.Draw) {
    return home_score === away_score ? BetStatus.Won : BetStatus.Lost
  }

  return BetStatus.Pending
}

function scoreAsianHandicap(bet: Bet, game: Game): BetStatus {
  if (game.asian_handicap_line == null) return BetStatus.Pending

  const handicap = game.asian_handicap_line
  const adjustedHome = game.home_score! + handicap
  const diff = adjustedHome - game.away_score!

  // Quarter handicap check
  const isQuarter = (Math.abs(handicap * 4) % 2) === 1

  if (isQuarter) {
    const lowerH = Math.floor(handicap * 2) / 2
    const upperH = Math.ceil(handicap * 2) / 2
    const lowerDiff = game.home_score! + lowerH - game.away_score!
    const upperDiff = game.home_score! + upperH - game.away_score!
    const isHome = bet.prediction === BetType.HomeWinAH
    const lowerWins = isHome ? lowerDiff > 0 : lowerDiff < 0
    const lowerPush = lowerDiff === 0
    const upperWins = isHome ? upperDiff > 0 : upperDiff < 0
    const upperPush = upperDiff === 0
    if (lowerWins && upperWins) return BetStatus.Won
    if (!lowerWins && !lowerPush && !upperWins && !upperPush) return BetStatus.Lost
    return BetStatus.Refunded
  }

  if (diff === 0) return BetStatus.Refunded
  const won = (bet.prediction === BetType.HomeWinAH && diff > 0) || (bet.prediction === BetType.AwayWinAH && diff < 0)
  return won ? BetStatus.Won : BetStatus.Lost
}

function scoreHandicap3Way(bet: Bet, game: Game): BetStatus {
  if (game.handicap_3way_line == null) return BetStatus.Pending
  const adjustedHome = game.home_score! + game.handicap_3way_line
  let actualResult: BetType
  if (adjustedHome > game.away_score!) actualResult = BetType.HomeWinH3W
  else if (adjustedHome < game.away_score!) actualResult = BetType.AwayWinH3W
  else actualResult = BetType.DrawH3W
  return bet.prediction === actualResult ? BetStatus.Won : BetStatus.Lost
}
