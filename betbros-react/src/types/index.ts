// --- Enums ---

export const BetType = {
  HomeWin: 'home_win',
  Draw: 'draw',
  AwayWin: 'away_win',
  Over: 'over',
  Under: 'under',
  OverOrUnder: 'over_or_under',
  ExactScore: 'exact_score',
  HomeWinToNil: 'home_win_to_nil',
  AwayWinToNil: 'away_win_to_nil',
  HomeWinDNB: 'home_win_dnb',
  AwayWinDNB: 'away_win_dnb',
  HomeWinAH: 'home_win_ah',
  AwayWinAH: 'away_win_ah',
  HomeWinH3W: 'home_win_h3w',
  DrawH3W: 'draw_h3w',
  AwayWinH3W: 'away_win_h3w',
} as const

export type BetType = (typeof BetType)[keyof typeof BetType]

export const BetStatus = {
  Pending: 'pending',
  Won: 'won',
  Lost: 'lost',
  Refunded: 'refunded',
} as const

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus]

export const GameStatus = {
  Scheduled: 'scheduled',
  Completed: 'completed',
} as const

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus]

// --- Database row types ---

export interface User {
  id: string
  username: string
  display_name: string
  rotation_order: number
  is_admin: boolean
  created_at: string
}

export interface GameWeek {
  id: string
  week_number: number
  start_date: string
  end_date: string
  game_selector_id: string
  is_complete: boolean
  net_profit: number | null
  is_cancelled: boolean
  is_catchup: boolean
  created_at: string
}

export interface Game {
  id: string
  game_week_id: string
  home_team: string
  away_team: string
  bet_kind: BetType
  over_under_line: number | null
  asian_handicap_line: number | null
  handicap_3way_line: number | null
  status: GameStatus
  home_score: number | null
  away_score: number | null
  created_at: string
}

export interface Bet {
  id: string
  game_id: string
  user_id: string
  prediction: BetType
  predicted_home_score: number | null
  predicted_away_score: number | null
  stake: number
  status: BetStatus
  placed_at: string
  scored_at: string | null
}

export interface Team {
  id: string
  name: string
  league: string
}

// --- Computed types ---

export interface UserStats {
  total_bets: number
  total_wins: number
  accuracy_percent: number
}

export interface FinancialStats {
  total_bet: number
  total_won: number
  total_lost: number
  net_profit: number
  roi_percent: number
  weeks_participated: number
  total_games_played: number
}

export interface FinancialSummary {
  total_bet: number
  total_won: number
  total_lost: number
  net_profit: number
  roi_percent: number
  total_weeks: number
  total_balance: number
}
