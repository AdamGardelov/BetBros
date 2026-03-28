import { describe, it, expect } from 'vitest'
import { isValidPrediction, getPredictionOptions } from '../src/lib/bet-validation'
import { BetType } from '../src/types'

describe('isValidPrediction', () => {
  it('HomeWin is valid for 1/X/2 game', () => {
    expect(isValidPrediction(BetType.HomeWin, BetType.HomeWin)).toBe(true)
  })
  it('Draw is valid for 1/X/2 game', () => {
    expect(isValidPrediction(BetType.Draw, BetType.HomeWin)).toBe(true)
  })
  it('HomeWinToNil is valid for 1/X/2 game', () => {
    expect(isValidPrediction(BetType.HomeWinToNil, BetType.HomeWin)).toBe(true)
  })
  it('HomeWinDNB is valid for 1/X/2 game', () => {
    expect(isValidPrediction(BetType.HomeWinDNB, BetType.HomeWin)).toBe(true)
  })
  it('Over is NOT valid for 1/X/2 game', () => {
    expect(isValidPrediction(BetType.Over, BetType.HomeWin)).toBe(false)
  })
  it('Over is valid for OverOrUnder game', () => {
    expect(isValidPrediction(BetType.Over, BetType.OverOrUnder)).toBe(true)
  })
  it('HomeWinAH is valid for AH game', () => {
    expect(isValidPrediction(BetType.HomeWinAH, BetType.HomeWinAH)).toBe(true)
  })
  it('HomeWin is NOT valid for AH game', () => {
    expect(isValidPrediction(BetType.HomeWin, BetType.HomeWinAH)).toBe(false)
  })
})

describe('getPredictionOptions', () => {
  it('returns 1/X/2 + WTN + DNB for a HomeWin game', () => {
    const options = getPredictionOptions(BetType.HomeWin)
    expect(options).toContain(BetType.HomeWin)
    expect(options).toContain(BetType.Draw)
    expect(options).toContain(BetType.AwayWin)
    expect(options).toContain(BetType.HomeWinToNil)
    expect(options).toContain(BetType.HomeWinDNB)
    expect(options).not.toContain(BetType.Over)
  })
  it('returns Over/Under for OverOrUnder game', () => {
    const options = getPredictionOptions(BetType.OverOrUnder)
    expect(options).toEqual([BetType.Over, BetType.Under])
  })
  it('returns ExactScore for ExactScore game', () => {
    const options = getPredictionOptions(BetType.ExactScore)
    expect(options).toEqual([BetType.ExactScore])
  })
  it('returns AH options for AH game', () => {
    const options = getPredictionOptions(BetType.HomeWinAH)
    expect(options).toEqual([BetType.HomeWinAH, BetType.AwayWinAH])
  })
  it('returns H3W options for H3W game', () => {
    const options = getPredictionOptions(BetType.HomeWinH3W)
    expect(options).toEqual([BetType.HomeWinH3W, BetType.DrawH3W, BetType.AwayWinH3W])
  })
})
