import { describe, it, expect } from 'vitest'
import { scoreBet } from '../src/lib/scoring'
import { BetType, BetStatus, GameStatus } from '../src/types'
import type { Bet, Game } from '../src/types'

function makeBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: 'bet-1',
    game_id: 'game-1',
    user_id: 'user-1',
    prediction: BetType.HomeWin,
    predicted_home_score: null,
    predicted_away_score: null,
    stake: 10,
    status: BetStatus.Pending,
    placed_at: '2024-01-01T00:00:00Z',
    scored_at: null,
    ...overrides,
  }
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    game_week_id: 'week-1',
    home_team: 'Home FC',
    away_team: 'Away FC',
    bet_kind: BetType.HomeWin,
    over_under_line: null,
    asian_handicap_line: null,
    handicap_3way_line: null,
    status: GameStatus.Completed,
    home_score: 2,
    away_score: 1,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('scoreBet', () => {
  // 1. Incomplete game
  describe('incomplete game', () => {
    it('returns Pending when game is not completed', () => {
      const game = makeGame({ status: GameStatus.Scheduled })
      const bet = makeBet({ prediction: BetType.HomeWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })

    it('returns Pending when home_score is null', () => {
      const game = makeGame({ home_score: null })
      const bet = makeBet({ prediction: BetType.HomeWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })

    it('returns Pending when away_score is null', () => {
      const game = makeGame({ away_score: null })
      const bet = makeBet({ prediction: BetType.HomeWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })
  })

  // 2. 1/X/2
  describe('1/X/2', () => {
    it('HomeWin wins when home team wins', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('HomeWin loses when away team wins', () => {
      const game = makeGame({ home_score: 0, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('HomeWin loses when draw', () => {
      const game = makeGame({ home_score: 1, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('Draw wins when scores are equal', () => {
      const game = makeGame({ home_score: 1, away_score: 1 })
      const bet = makeBet({ prediction: BetType.Draw })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('Draw loses when home wins', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.Draw })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('AwayWin wins when away team wins', () => {
      const game = makeGame({ home_score: 0, away_score: 2 })
      const bet = makeBet({ prediction: BetType.AwayWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('AwayWin loses when home team wins', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.AwayWin })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })
  })

  // 3. Win to Nil
  describe('Win to Nil', () => {
    it('HomeWinToNil wins when home wins and away scores 0', () => {
      const game = makeGame({ home_score: 2, away_score: 0 })
      const bet = makeBet({ prediction: BetType.HomeWinToNil })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('HomeWinToNil loses when away scores', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWinToNil })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('HomeWinToNil loses when draw 0-0', () => {
      const game = makeGame({ home_score: 0, away_score: 0 })
      const bet = makeBet({ prediction: BetType.HomeWinToNil })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('AwayWinToNil wins when away wins and home scores 0', () => {
      const game = makeGame({ home_score: 0, away_score: 3 })
      const bet = makeBet({ prediction: BetType.AwayWinToNil })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('AwayWinToNil loses when home scores', () => {
      const game = makeGame({ home_score: 1, away_score: 2 })
      const bet = makeBet({ prediction: BetType.AwayWinToNil })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })
  })

  // 4. Draw No Bet
  describe('Draw No Bet', () => {
    it('HomeWinDNB is refunded on draw', () => {
      const game = makeGame({ home_score: 1, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWinDNB })
      expect(scoreBet(bet, game)).toBe(BetStatus.Refunded)
    })

    it('HomeWinDNB wins on home win', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWinDNB })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('HomeWinDNB loses on away win', () => {
      const game = makeGame({ home_score: 0, away_score: 1 })
      const bet = makeBet({ prediction: BetType.HomeWinDNB })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('AwayWinDNB loses on home win', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.AwayWinDNB })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('AwayWinDNB wins on away win', () => {
      const game = makeGame({ home_score: 0, away_score: 2 })
      const bet = makeBet({ prediction: BetType.AwayWinDNB })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('AwayWinDNB is refunded on draw', () => {
      const game = makeGame({ home_score: 0, away_score: 0 })
      const bet = makeBet({ prediction: BetType.AwayWinDNB })
      expect(scoreBet(bet, game)).toBe(BetStatus.Refunded)
    })
  })

  // 5. Exact Score
  describe('Exact Score', () => {
    it('wins on exact match', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.ExactScore, predicted_home_score: 2, predicted_away_score: 1 })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('loses on wrong score', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.ExactScore, predicted_home_score: 1, predicted_away_score: 1 })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('returns Pending without predicted scores', () => {
      const game = makeGame({ home_score: 2, away_score: 1 })
      const bet = makeBet({ prediction: BetType.ExactScore, predicted_home_score: null, predicted_away_score: null })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })
  })

  // 6. Over/Under
  describe('Over/Under', () => {
    it('Over wins when total goals > line', () => {
      const game = makeGame({ home_score: 2, away_score: 1, over_under_line: 2.5 })
      const bet = makeBet({ prediction: BetType.Over })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('Under wins when total goals < line', () => {
      const game = makeGame({ home_score: 1, away_score: 0, over_under_line: 2.5 })
      const bet = makeBet({ prediction: BetType.Under })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('Over loses when total goals < line', () => {
      const game = makeGame({ home_score: 1, away_score: 0, over_under_line: 2.5 })
      const bet = makeBet({ prediction: BetType.Over })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('Under loses when total goals > line', () => {
      const game = makeGame({ home_score: 2, away_score: 1, over_under_line: 2.5 })
      const bet = makeBet({ prediction: BetType.Under })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('returns Pending without over_under_line', () => {
      const game = makeGame({ home_score: 2, away_score: 1, over_under_line: null })
      const bet = makeBet({ prediction: BetType.Over })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })
  })

  // 7. Asian Handicap
  describe('Asian Handicap', () => {
    it('HomeWinAH wins with -0.5 when home wins', () => {
      // home 2-1: adjusted 2 + (-0.5) = 1.5 > 1, home wins
      const game = makeGame({ home_score: 2, away_score: 1, asian_handicap_line: -0.5 })
      const bet = makeBet({ prediction: BetType.HomeWinAH })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('HomeWinAH loses with -0.5 on draw', () => {
      // home 1-1: adjusted 1 + (-0.5) = 0.5 < 1, away wins
      const game = makeGame({ home_score: 1, away_score: 1, asian_handicap_line: -0.5 })
      const bet = makeBet({ prediction: BetType.HomeWinAH })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('AwayWinAH wins with -0.5 when home draws', () => {
      // away gets -0.5: diff = home + handicap - away = 1 + (-0.5) - 1 = -0.5 < 0, away wins
      const game = makeGame({ home_score: 1, away_score: 1, asian_handicap_line: -0.5 })
      const bet = makeBet({ prediction: BetType.AwayWinAH })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('refunds when handicap-adjusted score is tied (AH +1.0, score 1-2)', () => {
      // home 1-2 with +1 handicap: adjusted 1 + 1 = 2 = 2, push/refund
      const game = makeGame({ home_score: 1, away_score: 2, asian_handicap_line: 1 })
      const bet = makeBet({ prediction: BetType.HomeWinAH })
      expect(scoreBet(bet, game)).toBe(BetStatus.Refunded)
    })

    it('returns Pending without asian_handicap_line', () => {
      const game = makeGame({ home_score: 2, away_score: 1, asian_handicap_line: null })
      const bet = makeBet({ prediction: BetType.HomeWinAH })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })

    describe('Quarter handicaps', () => {
      it('HomeWinAH -0.25: home wins 1-0 = full win', () => {
        // lower (-0.5): 1 + (-0.5) - 0 = 0.5 > 0, home wins
        // upper (0): 1 + 0 - 0 = 1 > 0, home wins
        // both win => Won
        const game = makeGame({ home_score: 1, away_score: 0, asian_handicap_line: -0.25 })
        const bet = makeBet({ prediction: BetType.HomeWinAH })
        expect(scoreBet(bet, game)).toBe(BetStatus.Won)
      })

      it('HomeWinAH -0.25: draw = refund', () => {
        // lower (-0.5): 0 + (-0.5) - 0 = -0.5, home loses
        // upper (0): 0 + 0 - 0 = 0, push
        // one loses, one pushes => Refunded
        const game = makeGame({ home_score: 0, away_score: 0, asian_handicap_line: -0.25 })
        const bet = makeBet({ prediction: BetType.HomeWinAH })
        expect(scoreBet(bet, game)).toBe(BetStatus.Refunded)
      })

      it('HomeWinAH -0.75: home wins 1-0 = refund (half win, half push)', () => {
        // lower (-1.0): 1 + (-1) - 0 = 0, push
        // upper (-0.5): 1 + (-0.5) - 0 = 0.5 > 0, home wins
        // one wins, one pushes => Refunded
        const game = makeGame({ home_score: 1, away_score: 0, asian_handicap_line: -0.75 })
        const bet = makeBet({ prediction: BetType.HomeWinAH })
        expect(scoreBet(bet, game)).toBe(BetStatus.Refunded)
      })

      it('HomeWinAH -0.75: home wins 2-0 = full win', () => {
        // lower (-1.0): 2 + (-1) - 0 = 1 > 0, home wins
        // upper (-0.5): 2 + (-0.5) - 0 = 1.5 > 0, home wins
        // both win => Won
        const game = makeGame({ home_score: 2, away_score: 0, asian_handicap_line: -0.75 })
        const bet = makeBet({ prediction: BetType.HomeWinAH })
        expect(scoreBet(bet, game)).toBe(BetStatus.Won)
      })

      it('HomeWinAH -0.75: draw = full loss', () => {
        // lower (-1.0): 0 + (-1) - 0 = -1 < 0, home loses
        // upper (-0.5): 0 + (-0.5) - 0 = -0.5 < 0, home loses
        // both lose => Lost
        const game = makeGame({ home_score: 0, away_score: 0, asian_handicap_line: -0.75 })
        const bet = makeBet({ prediction: BetType.HomeWinAH })
        expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
      })
    })
  })

  // 8. Handicap 3-Way
  describe('Handicap 3-Way', () => {
    it('HomeWinH3W wins with -1 when home wins by 2', () => {
      // home 2-0 with -1: adjusted 2 + (-1) = 1 > 0, home wins
      const game = makeGame({ home_score: 2, away_score: 0, handicap_3way_line: -1 })
      const bet = makeBet({ prediction: BetType.HomeWinH3W })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('DrawH3W wins with -1 when home wins by 1', () => {
      // home 2-1 with -1: adjusted 2 + (-1) = 1 = 1, draw
      const game = makeGame({ home_score: 2, away_score: 1, handicap_3way_line: -1 })
      const bet = makeBet({ prediction: BetType.DrawH3W })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('AwayWinH3W wins with -1 on actual draw', () => {
      // home 0-0 with -1: adjusted 0 + (-1) = -1 < 0, away wins
      const game = makeGame({ home_score: 0, away_score: 0, handicap_3way_line: -1 })
      const bet = makeBet({ prediction: BetType.AwayWinH3W })
      expect(scoreBet(bet, game)).toBe(BetStatus.Won)
    })

    it('HomeWinH3W loses when draw after handicap', () => {
      // home 2-1 with -1: adjusted 2 + (-1) = 1 = 1, draw, not home win
      const game = makeGame({ home_score: 2, away_score: 1, handicap_3way_line: -1 })
      const bet = makeBet({ prediction: BetType.HomeWinH3W })
      expect(scoreBet(bet, game)).toBe(BetStatus.Lost)
    })

    it('returns Pending without handicap_3way_line', () => {
      const game = makeGame({ home_score: 2, away_score: 1, handicap_3way_line: null })
      const bet = makeBet({ prediction: BetType.HomeWinH3W })
      expect(scoreBet(bet, game)).toBe(BetStatus.Pending)
    })
  })
})
