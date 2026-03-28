import { BetType } from '../types'

const MATCH_1X2: BetType[] = [BetType.HomeWin, BetType.Draw, BetType.AwayWin]
const WIN_TO_NIL: BetType[] = [BetType.HomeWinToNil, BetType.AwayWinToNil]
const DNB: BetType[] = [BetType.HomeWinDNB, BetType.AwayWinDNB]
const OVER_UNDER: BetType[] = [BetType.Over, BetType.Under]
const ASIAN_HANDICAP: BetType[] = [BetType.HomeWinAH, BetType.AwayWinAH]
const HANDICAP_3WAY: BetType[] = [BetType.HomeWinH3W, BetType.DrawH3W, BetType.AwayWinH3W]

function is1X2Game(betKind: BetType): boolean {
  return MATCH_1X2.includes(betKind)
}

export function getPredictionOptions(betKind: BetType): BetType[] {
  if (is1X2Game(betKind)) return [...MATCH_1X2, ...WIN_TO_NIL, ...DNB]
  if (betKind === BetType.OverOrUnder) return [...OVER_UNDER]
  if (betKind === BetType.ExactScore) return [BetType.ExactScore]
  if (ASIAN_HANDICAP.includes(betKind)) return [...ASIAN_HANDICAP]
  if (HANDICAP_3WAY.includes(betKind)) return [...HANDICAP_3WAY]
  return []
}

export function isValidPrediction(prediction: BetType, betKind: BetType): boolean {
  return getPredictionOptions(betKind).includes(prediction)
}
