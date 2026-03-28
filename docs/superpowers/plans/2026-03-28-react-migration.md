# BetBros React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate BetBros from Blazor Server to React 19 + Vite + Supabase + Vercel with the same functionality.

**Architecture:** React SPA with Supabase for auth/database/edge functions. Simple CRUD goes directly via Supabase client with RLS. Complex logic (scoring, week creation, cascade) lives in Edge Functions. Shared scoring/rotation logic is used by both frontend and edge functions.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Supabase (Auth, Postgres, Edge Functions), Vitest, Vercel

**Spec:** `docs/superpowers/specs/2026-03-28-react-migration-design.md`

---

## File Structure

```
betbros-react/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Router setup
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client singleton
│   │   ├── scoring.ts             # ScoringEngine (pure functions)
│   │   ├── rotation.ts            # RotationCalculator (pure functions)
│   │   ├── constants.ts           # WEEKLY_STAKE, BASE_DATE, etc.
│   │   ├── bet-validation.ts      # Prediction/game-kind validation
│   │   └── query-keys.ts          # TanStack Query key factory
│   ├── types/
│   │   └── index.ts               # All TypeScript types + enums
│   ├── hooks/
│   │   ├── use-auth.ts            # Auth state, signIn, signOut
│   │   ├── use-game-weeks.ts      # GameWeek queries + mutations
│   │   ├── use-games.ts           # Game queries + mutations
│   │   ├── use-bets.ts            # Bet queries + mutations
│   │   ├── use-leaderboard.ts     # Leaderboard query
│   │   ├── use-stats.ts           # Financial stats queries
│   │   └── use-teams.ts           # Teams query
│   ├── components/
│   │   ├── protected-route.tsx    # Auth guard
│   │   ├── admin-route.tsx        # Auth + isAdmin guard
│   │   ├── game-card.tsx          # Match display card
│   │   ├── bet-picker.tsx         # Prediction input per bet type
│   │   ├── week-header.tsx        # Week number, selector, dates
│   │   ├── stats-card.tsx         # Number + label card
│   │   ├── team-autocomplete.tsx  # Team search input
│   │   └── layout.tsx             # App shell with nav
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   ├── game-selection.tsx
│   │   ├── enter-results.tsx
│   │   ├── leaderboard.tsx
│   │   ├── statistics.tsx
│   │   ├── history.tsx
│   │   └── admin.tsx
│   └── utils/
│       └── format.ts              # Currency, date, percentage formatting
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── scoring.ts
│   │   │   └── rotation.ts
│   │   ├── create-gameweek/index.ts
│   │   ├── enter-results/index.ts
│   │   └── cascade-selector/index.ts
│   └── seed.sql
├── tests/
│   ├── scoring.test.ts
│   ├── rotation.test.ts
│   └── bet-validation.test.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json               # shadcn/ui config
├── .env.local.example
└── vercel.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `betbros-react/package.json`, `betbros-react/vite.config.ts`, `betbros-react/tsconfig.json`, `betbros-react/index.html`, `betbros-react/src/main.tsx`, `betbros-react/src/App.tsx`, `betbros-react/tailwind.config.ts`, `betbros-react/postcss.config.js`

- [ ] **Step 1: Create Vite React project**

```bash
cd /home/adam/Documents/Dev/BetBros
npm create vite@latest betbros-react -- --template react-ts
cd betbros-react
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install react-router-dom @tanstack/react-query @supabase/supabase-js zod
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind with Vite**

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
```

Update `src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc color, CSS variables. This creates `components.json` and updates `tailwind.config.ts`.

- [ ] **Step 5: Add shadcn/ui components we'll need**

```bash
npx shadcn@latest add button card input label tabs select dialog alert badge table separator command popover accordion
```

- [ ] **Step 6: Create test setup file**

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 7: Create env example file**

Create `.env.local.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 8: Verify the app runs**

```bash
npm run dev
```

Expected: Vite dev server starts, React app loads at localhost:5173.

- [ ] **Step 9: Commit**

```bash
git add betbros-react/
git commit -m "scaffold: Vite + React + TypeScript + Tailwind + shadcn/ui"
```

---

## Task 2: TypeScript Types and Enums

**Files:**
- Create: `betbros-react/src/types/index.ts`, `betbros-react/src/lib/constants.ts`

- [ ] **Step 1: Create types and enums**

Create `src/types/index.ts`:

```typescript
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
```

- [ ] **Step 2: Create constants**

Create `src/lib/constants.ts`:

```typescript
export const WEEKLY_STAKE = 200
export const MAX_GAMES_PER_WEEK = 3
export const BASE_DATE = new Date(Date.UTC(2025, 10, 24)) // Nov 24, 2025
```

- [ ] **Step 3: Commit**

```bash
git add src/types/ src/lib/constants.ts
git commit -m "feat: add TypeScript types, enums, and constants"
```

---

## Task 3: Scoring Engine (TDD)

**Files:**
- Create: `betbros-react/src/lib/scoring.ts`, `betbros-react/tests/scoring.test.ts`

- [ ] **Step 1: Write failing tests for 1/X/2 scoring**

Create `tests/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { scoreBet } from '../src/lib/scoring'
import { BetType, BetStatus, GameStatus } from '../src/types'
import type { Bet, Game } from '../src/types'

function makeBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: '1', game_id: '1', user_id: '1',
    prediction: BetType.HomeWin,
    predicted_home_score: null, predicted_away_score: null,
    stake: 100, status: BetStatus.Pending,
    placed_at: '', scored_at: null,
    ...overrides,
  }
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: '1', game_week_id: '1',
    home_team: 'Team A', away_team: 'Team B',
    bet_kind: BetType.HomeWin,
    over_under_line: null, asian_handicap_line: null, handicap_3way_line: null,
    status: GameStatus.Completed,
    home_score: 2, away_score: 1,
    created_at: '',
    ...overrides,
  }
}

describe('scoreBet', () => {
  describe('incomplete game', () => {
    it('returns Pending when game is not completed', () => {
      const result = scoreBet(makeBet(), makeGame({ status: GameStatus.Scheduled }))
      expect(result).toBe(BetStatus.Pending)
    })

    it('returns Pending when scores are missing', () => {
      const result = scoreBet(makeBet(), makeGame({ home_score: null, away_score: null }))
      expect(result).toBe(BetStatus.Pending)
    })
  })

  describe('1/X/2', () => {
    it('HomeWin wins when home > away', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWin }),
        makeGame({ home_score: 2, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('HomeWin loses when home < away', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWin }),
        makeGame({ home_score: 0, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })

    it('HomeWin loses on draw', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWin }),
        makeGame({ home_score: 1, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })

    it('Draw wins on draw', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.Draw }),
        makeGame({ home_score: 1, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('AwayWin wins when away > home', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.AwayWin }),
        makeGame({ home_score: 0, away_score: 3 }),
      )
      expect(result).toBe(BetStatus.Won)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd betbros-react && npx vitest run tests/scoring.test.ts
```

Expected: FAIL — `scoreBet` not found.

- [ ] **Step 3: Implement scoreBet for 1/X/2**

Create `src/lib/scoring.ts`:

```typescript
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
      ? BetStatus.Won
      : BetStatus.Lost
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
  if (
    bet.prediction === BetType.HomeWinH3W ||
    bet.prediction === BetType.DrawH3W ||
    bet.prediction === BetType.AwayWinH3W
  ) {
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

  // Quarter handicap check: e.g. -0.25, +0.75
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

  // Standard/half handicap
  if (diff === 0) return BetStatus.Refunded

  const won =
    (bet.prediction === BetType.HomeWinAH && diff > 0) ||
    (bet.prediction === BetType.AwayWinAH && diff < 0)

  return won ? BetStatus.Won : BetStatus.Lost
}

function scoreHandicap3Way(bet: Bet, game: Game): BetStatus {
  if (game.handicap_3way_line == null) return BetStatus.Pending

  const adjustedHome = game.home_score! + game.handicap_3way_line

  let actualResult: BetType
  if (adjustedHome > game.away_score!) {
    actualResult = BetType.HomeWinH3W
  } else if (adjustedHome < game.away_score!) {
    actualResult = BetType.AwayWinH3W
  } else {
    actualResult = BetType.DrawH3W
  }

  return bet.prediction === actualResult ? BetStatus.Won : BetStatus.Lost
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/scoring.test.ts
```

Expected: All 1/X/2 tests PASS.

- [ ] **Step 5: Add tests for Win to Nil, DNB, Exact Score, Over/Under**

Add to `tests/scoring.test.ts`:

```typescript
  describe('Win to Nil', () => {
    it('HomeWinToNil wins on clean sheet home win', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinToNil }),
        makeGame({ home_score: 2, away_score: 0 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('HomeWinToNil loses when away scores', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinToNil }),
        makeGame({ home_score: 2, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })

    it('AwayWinToNil wins on clean sheet away win', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.AwayWinToNil }),
        makeGame({ home_score: 0, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })
  })

  describe('Draw No Bet', () => {
    it('HomeWinDNB refunded on draw', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinDNB }),
        makeGame({ home_score: 1, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Refunded)
    })

    it('HomeWinDNB wins on home win', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinDNB }),
        makeGame({ home_score: 2, away_score: 0 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('AwayWinDNB loses on home win', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.AwayWinDNB }),
        makeGame({ home_score: 2, away_score: 0 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })
  })

  describe('Exact Score', () => {
    it('wins on exact match', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.ExactScore, predicted_home_score: 2, predicted_away_score: 1 }),
        makeGame({ home_score: 2, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('loses on wrong score', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.ExactScore, predicted_home_score: 2, predicted_away_score: 1 }),
        makeGame({ home_score: 3, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })

    it('returns Pending without predicted scores', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.ExactScore }),
        makeGame({ home_score: 2, away_score: 1 }),
      )
      expect(result).toBe(BetStatus.Pending)
    })
  })

  describe('Over/Under', () => {
    it('Over wins when total > line', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.Over }),
        makeGame({ home_score: 2, away_score: 1, bet_kind: BetType.OverOrUnder, over_under_line: 2.5 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('Under wins when total < line', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.Under }),
        makeGame({ home_score: 1, away_score: 0, bet_kind: BetType.OverOrUnder, over_under_line: 2.5 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('Over loses when total < line', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.Over }),
        makeGame({ home_score: 1, away_score: 0, bet_kind: BetType.OverOrUnder, over_under_line: 2.5 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })
  })
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run tests/scoring.test.ts
```

Expected: All pass.

- [ ] **Step 7: Add Asian Handicap tests**

Add to `tests/scoring.test.ts`:

```typescript
  describe('Asian Handicap', () => {
    it('HomeWinAH wins with -0.5 and home wins', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 2, away_score: 1, asian_handicap_line: -0.5 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('HomeWinAH loses with -0.5 on draw', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 1, asian_handicap_line: -0.5 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })

    it('AwayWinAH wins with -0.5 when home draws', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.AwayWinAH }),
        makeGame({ home_score: 1, away_score: 1, asian_handicap_line: -0.5 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('push (refund) when handicap-adjusted score is tied', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 2, asian_handicap_line: 1.0 }),
      )
      expect(result).toBe(BetStatus.Refunded)
    })

    // Quarter handicap tests
    it('HomeWinAH -0.25: home wins 1-0 = full win (both halves win)', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 0, asian_handicap_line: -0.25 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('HomeWinAH -0.25: draw = refund (one half push, one half lose)', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 1, asian_handicap_line: -0.25 }),
      )
      expect(result).toBe(BetStatus.Refunded)
    })

    it('HomeWinAH -0.75: home wins 1-0 = refund (half win, half push)', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 0, asian_handicap_line: -0.75 }),
      )
      expect(result).toBe(BetStatus.Refunded)
    })

    it('HomeWinAH -0.75: home wins 2-0 = full win', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 2, away_score: 0, asian_handicap_line: -0.75 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('HomeWinAH -0.75: draw = full loss', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 1, asian_handicap_line: -0.75 }),
      )
      expect(result).toBe(BetStatus.Lost)
    })

    it('returns Pending without handicap line', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinAH }),
        makeGame({ home_score: 1, away_score: 0, asian_handicap_line: null }),
      )
      expect(result).toBe(BetStatus.Pending)
    })
  })
```

- [ ] **Step 8: Run tests**

```bash
npx vitest run tests/scoring.test.ts
```

Expected: All pass.

- [ ] **Step 9: Add Handicap 3-Way tests**

Add to `tests/scoring.test.ts`:

```typescript
  describe('Handicap 3-Way', () => {
    it('HomeWinH3W wins with -1 handicap and home wins by 2', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinH3W }),
        makeGame({ home_score: 3, away_score: 1, handicap_3way_line: -1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('DrawH3W wins with -1 handicap and home wins by 1', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.DrawH3W }),
        makeGame({ home_score: 2, away_score: 1, handicap_3way_line: -1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('AwayWinH3W wins with -1 handicap on draw', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.AwayWinH3W }),
        makeGame({ home_score: 1, away_score: 1, handicap_3way_line: -1 }),
      )
      expect(result).toBe(BetStatus.Won)
    })

    it('returns Pending without handicap line', () => {
      const result = scoreBet(
        makeBet({ prediction: BetType.HomeWinH3W }),
        makeGame({ home_score: 2, away_score: 1, handicap_3way_line: null }),
      )
      expect(result).toBe(BetStatus.Pending)
    })
  })
```

- [ ] **Step 10: Run all tests**

```bash
npx vitest run tests/scoring.test.ts
```

Expected: All pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/scoring.ts tests/scoring.test.ts
git commit -m "feat: port ScoringEngine to TypeScript with full test coverage"
```

---

## Task 4: Rotation Calculator (TDD)

**Files:**
- Create: `betbros-react/src/lib/rotation.ts`, `betbros-react/tests/rotation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/rotation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getSelectorForWeek, getWeekDates, getCurrentWeekNumber } from '../src/lib/rotation'
import type { User } from '../src/types'
import { BASE_DATE } from '../src/lib/constants'

const users: User[] = [
  { id: '3', username: 'danielsson', display_name: 'Danielsson', rotation_order: 0, is_admin: false, created_at: '' },
  { id: '1', username: 'gardelov', display_name: 'Gärdelöv', rotation_order: 1, is_admin: true, created_at: '' },
  { id: '2', username: 'carlsson', display_name: 'Carlsson', rotation_order: 2, is_admin: false, created_at: '' },
  { id: '4', username: 'seeger', display_name: 'Seeger', rotation_order: 3, is_admin: false, created_at: '' },
]

describe('getSelectorForWeek', () => {
  it('week 1 -> rotation_order 0 (Danielsson)', () => {
    expect(getSelectorForWeek(1, users).username).toBe('danielsson')
  })

  it('week 2 -> rotation_order 1 (Gardelov)', () => {
    expect(getSelectorForWeek(2, users).username).toBe('gardelov')
  })

  it('week 5 wraps back to Danielsson', () => {
    expect(getSelectorForWeek(5, users).username).toBe('danielsson')
  })

  it('handles unsorted users input', () => {
    const shuffled = [...users].reverse()
    expect(getSelectorForWeek(1, shuffled).username).toBe('danielsson')
  })
})

describe('getWeekDates', () => {
  it('week 1 starts on BASE_DATE', () => {
    const { start } = getWeekDates(1, BASE_DATE)
    expect(start.getTime()).toBe(BASE_DATE.getTime())
  })

  it('week 2 starts 7 days later', () => {
    const { start } = getWeekDates(2, BASE_DATE)
    const expected = new Date(BASE_DATE.getTime() + 7 * 24 * 60 * 60 * 1000)
    expect(start.getTime()).toBe(expected.getTime())
  })

  it('end is 6 days 23:59:59 after start', () => {
    const { start, end } = getWeekDates(1, BASE_DATE)
    const expectedEnd = new Date(start.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)
    expect(end.getTime()).toBe(expectedEnd.getTime())
  })
})

describe('getCurrentWeekNumber', () => {
  it('returns 1 before base date', () => {
    const before = new Date(Date.UTC(2025, 10, 20))
    expect(getCurrentWeekNumber(BASE_DATE, before)).toBe(1)
  })

  it('returns 1 on base date', () => {
    expect(getCurrentWeekNumber(BASE_DATE, BASE_DATE)).toBe(1)
  })

  it('returns 2 one week after base date', () => {
    const oneWeekLater = new Date(BASE_DATE.getTime() + 7 * 24 * 60 * 60 * 1000)
    expect(getCurrentWeekNumber(BASE_DATE, oneWeekLater)).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run tests/rotation.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement rotation logic**

Create `src/lib/rotation.ts`:

```typescript
import type { User } from '../types'

export function getSelectorForWeek(weekNumber: number, users: User[]): User {
  const ordered = [...users].sort((a, b) => a.rotation_order - b.rotation_order)
  const index = (weekNumber - 1) % ordered.length
  return ordered[index]
}

export function getWeekDates(weekNumber: number, baseDate: Date): { start: Date; end: Date } {
  const start = new Date(baseDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)
  return { start, end }
}

export function getCurrentWeekNumber(baseDate: Date, now: Date = new Date()): number {
  const daysSinceBase = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceBase < 0) return 1
  return Math.floor(daysSinceBase / 7) + 1
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/rotation.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rotation.ts tests/rotation.test.ts
git commit -m "feat: port RotationCalculator to TypeScript with tests"
```

---

## Task 5: Bet Validation (TDD)

**Files:**
- Create: `betbros-react/src/lib/bet-validation.ts`, `betbros-react/tests/bet-validation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/bet-validation.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run tests/bet-validation.test.ts
```

- [ ] **Step 3: Implement**

Create `src/lib/bet-validation.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/bet-validation.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bet-validation.ts tests/bet-validation.test.ts
git commit -m "feat: add bet validation logic with tests"
```

---

## Task 6: Supabase Project Setup and Migration

**Files:**
- Create: `betbros-react/supabase/config.toml`, `betbros-react/supabase/migrations/00001_initial_schema.sql`, `betbros-react/supabase/seed.sql`

- [ ] **Step 1: Initialize Supabase locally**

```bash
cd betbros-react
npx supabase init
```

This creates `supabase/config.toml`.

- [ ] **Step 2: Create the initial migration**

Create `supabase/migrations/00001_initial_schema.sql`:

```sql
-- Enums
create type bet_type as enum (
  'home_win', 'draw', 'away_win',
  'over', 'under', 'over_or_under',
  'exact_score',
  'home_win_to_nil', 'away_win_to_nil',
  'home_win_dnb', 'away_win_dnb',
  'home_win_ah', 'away_win_ah',
  'home_win_h3w', 'draw_h3w', 'away_win_h3w'
);

create type bet_status as enum ('pending', 'won', 'lost', 'refunded');

create type game_status as enum ('scheduled', 'completed');

-- Users (linked to auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  rotation_order int not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Game Weeks
create table game_weeks (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  start_date date not null,
  end_date date not null,
  game_selector_id uuid not null references users(id),
  is_complete boolean not null default false,
  net_profit numeric(10,2),
  is_cancelled boolean not null default false,
  is_catchup boolean not null default false,
  created_at timestamptz not null default now()
);

-- Games
create table games (
  id uuid primary key default gen_random_uuid(),
  game_week_id uuid not null references game_weeks(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  bet_kind bet_type not null,
  over_under_line numeric(5,2),
  asian_handicap_line numeric(5,2),
  handicap_3way_line numeric(5,2),
  status game_status not null default 'scheduled',
  home_score int,
  away_score int,
  created_at timestamptz not null default now()
);

-- Bets
create table bets (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  user_id uuid not null references users(id),
  prediction bet_type not null,
  predicted_home_score int,
  predicted_away_score int,
  stake numeric(10,2) not null,
  status bet_status not null default 'pending',
  placed_at timestamptz not null default now(),
  scored_at timestamptz,
  unique(game_id, user_id)
);

-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  league text not null
);

-- Indexes
create index idx_game_weeks_week_number on game_weeks(week_number);
create index idx_games_game_week_id on games(game_week_id);
create index idx_bets_game_id on bets(game_id);
create index idx_bets_user_id on bets(user_id);

-- RLS
alter table users enable row level security;
alter table game_weeks enable row level security;
alter table games enable row level security;
alter table bets enable row level security;
alter table teams enable row level security;

-- Read: all authenticated users can read everything
create policy "Authenticated users can read users" on users
  for select to authenticated using (true);

create policy "Authenticated users can read game_weeks" on game_weeks
  for select to authenticated using (true);

create policy "Authenticated users can read games" on games
  for select to authenticated using (true);

create policy "Authenticated users can read bets" on bets
  for select to authenticated using (true);

create policy "Authenticated users can read teams" on teams
  for select to authenticated using (true);

-- Write: bets - only own bets
create policy "Users can insert own bets" on bets
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own bets" on bets
  for update to authenticated using (user_id = auth.uid());

-- Write: games - only week selector can insert/update/delete
create policy "Selector can insert games" on games
  for insert to authenticated
  with check (
    exists (
      select 1 from game_weeks
      where game_weeks.id = game_week_id
      and game_weeks.game_selector_id = auth.uid()
    )
  );

create policy "Selector can update games" on games
  for update to authenticated
  using (
    exists (
      select 1 from game_weeks
      where game_weeks.id = game_week_id
      and game_weeks.game_selector_id = auth.uid()
    )
  );

create policy "Selector can delete games" on games
  for delete to authenticated
  using (
    exists (
      select 1 from game_weeks
      where game_weeks.id = game_week_id
      and game_weeks.game_selector_id = auth.uid()
    )
  );

-- Write: game_weeks - selector can update net_profit
create policy "Selector can update own week" on game_weeks
  for update to authenticated
  using (game_selector_id = auth.uid());
```

- [ ] **Step 3: Create seed data**

Create `supabase/seed.sql`:

```sql
-- Teams are seeded here. Users are created via Supabase Auth + trigger.
-- This file seeds teams only. Users are created manually via Supabase dashboard
-- or a setup script after auth accounts are created.

insert into teams (name, league) values
  ('Arsenal', 'Premier League'),
  ('Manchester City', 'Premier League'),
  ('Chelsea', 'Premier League'),
  ('Aston Villa', 'Premier League'),
  ('Brighton', 'Premier League'),
  ('Sunderland', 'Premier League'),
  ('Manchester United', 'Premier League'),
  ('Liverpool', 'Premier League'),
  ('Crystal Palace', 'Premier League'),
  ('Bournemouth', 'Premier League'),
  ('Brentford', 'Premier League'),
  ('Everton', 'Premier League'),
  ('Tottenham', 'Premier League'),
  ('Newcastle', 'Premier League'),
  ('Fulham', 'Premier League'),
  ('Nottingham Forest', 'Premier League'),
  ('West Ham', 'Premier League'),
  ('Leeds United', 'Premier League'),
  ('Burnley', 'Premier League'),
  ('Wolverhampton', 'Premier League'),
  ('Coventry City', 'Championship'),
  ('Middlesbrough', 'Championship'),
  ('Millwall', 'Championship'),
  ('Stoke City', 'Championship'),
  ('Preston North End', 'Championship'),
  ('Bristol City', 'Championship'),
  ('Birmingham City', 'Championship'),
  ('Hull City', 'Championship'),
  ('Ipswich Town', 'Championship'),
  ('Wrexham', 'Championship'),
  ('Derby County', 'Championship'),
  ('West Bromwich Albion', 'Championship'),
  ('Queens Park Rangers', 'Championship'),
  ('Southampton', 'Championship'),
  ('Watford', 'Championship'),
  ('Leicester City', 'Championship'),
  ('Charlton Athletic', 'Championship'),
  ('Blackburn Rovers', 'Championship'),
  ('Sheffield United', 'Championship'),
  ('Oxford United', 'Championship'),
  ('Swansea City', 'Championship'),
  ('Portsmouth', 'Championship'),
  ('Norwich City', 'Championship'),
  ('Sheffield Wednesday', 'Championship'),
  ('AC Milan', 'Serie A'),
  ('Napoli', 'Serie A'),
  ('Inter Milan', 'Serie A'),
  ('AS Roma', 'Serie A'),
  ('Como 1907', 'Serie A'),
  ('Bologna', 'Serie A'),
  ('Juventus', 'Serie A'),
  ('Lazio', 'Serie A'),
  ('Udinese', 'Serie A'),
  ('Sassuolo', 'Serie A'),
  ('Cremonese', 'Serie A'),
  ('Atalanta', 'Serie A'),
  ('Torino', 'Serie A'),
  ('Lecce', 'Serie A'),
  ('Cagliari', 'Serie A'),
  ('Genoa', 'Serie A'),
  ('Parma', 'Serie A'),
  ('Pisa SC', 'Serie A'),
  ('Fiorentina', 'Serie A'),
  ('Hellas Verona', 'Serie A'),
  ('RC Lens', 'Ligue 1'),
  ('Paris Saint-Germain', 'Ligue 1'),
  ('Olympique de Marseille', 'Ligue 1'),
  ('LOSC Lille', 'Ligue 1'),
  ('Stade Rennais', 'Ligue 1'),
  ('Olympique Lyonnais', 'Ligue 1'),
  ('AS Monaco', 'Ligue 1'),
  ('RC Strasbourg Alsace', 'Ligue 1'),
  ('Toulouse FC', 'Ligue 1'),
  ('OGC Nice', 'Ligue 1'),
  ('Stade Brestois', 'Ligue 1'),
  ('Angers SCO', 'Ligue 1'),
  ('Paris FC', 'Ligue 1'),
  ('Le Havre AC', 'Ligue 1'),
  ('FC Lorient', 'Ligue 1'),
  ('FC Nantes', 'Ligue 1'),
  ('FC Metz', 'Ligue 1'),
  ('AJ Auxerre', 'Ligue 1'),
  ('Mjällby', 'Allsvenskan'),
  ('Hammarby', 'Allsvenskan'),
  ('GAIS', 'Allsvenskan'),
  ('IFK Göteborg', 'Allsvenskan'),
  ('Djurgården', 'Allsvenskan'),
  ('Malmö FF', 'Allsvenskan'),
  ('AIK', 'Allsvenskan'),
  ('Elfsborg', 'Allsvenskan'),
  ('Sirius', 'Allsvenskan'),
  ('Häcken', 'Allsvenskan'),
  ('Halmstad', 'Allsvenskan'),
  ('Brommapojkarna', 'Allsvenskan'),
  ('Degerfors', 'Allsvenskan'),
  ('Norrköping', 'Allsvenskan'),
  ('Öster', 'Allsvenskan'),
  ('Värnamo', 'Allsvenskan'),
  ('Västerås SK', 'Superettan'),
  ('Kalmar FF', 'Superettan'),
  ('Örgryte', 'Superettan'),
  ('Oddevold', 'Superettan'),
  ('Falkenberg', 'Superettan'),
  ('Varbergs BoIS', 'Superettan'),
  ('Helsingborg', 'Superettan'),
  ('Brage', 'Superettan'),
  ('BoIS', 'Superettan'),
  ('Sandviken', 'Superettan'),
  ('Sundsvall', 'Superettan'),
  ('Östersund', 'Superettan'),
  ('Utsikten', 'Superettan'),
  ('Örebro', 'Superettan'),
  ('Trelleborg', 'Superettan'),
  ('Umeå FC', 'Superettan'),
  ('Barcelona', 'La Liga'),
  ('Real Madrid', 'La Liga'),
  ('Villarreal', 'La Liga'),
  ('Atlético Madrid', 'La Liga'),
  ('Real Betis', 'La Liga'),
  ('Espanyol', 'La Liga'),
  ('Getafe', 'La Liga'),
  ('Athletic Bilbao', 'La Liga'),
  ('Rayo Vallecano', 'La Liga'),
  ('Real Sociedad', 'La Liga'),
  ('Elche', 'La Liga'),
  ('Celta Vigo', 'La Liga'),
  ('Sevilla', 'La Liga'),
  ('Alavés', 'La Liga'),
  ('Valencia', 'La Liga'),
  ('Real Mallorca', 'La Liga'),
  ('Osasuna', 'La Liga'),
  ('Girona', 'La Liga'),
  ('Levante', 'La Liga'),
  ('Real Oviedo', 'La Liga');
```

- [ ] **Step 4: Start local Supabase and apply migration**

```bash
npx supabase start
npx supabase db reset
```

Expected: Local Supabase starts, migration applies, seed runs.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: Supabase schema, RLS policies, and team seed data"
```

---

## Task 7: Supabase Client and Auth Hook

**Files:**
- Create: `betbros-react/src/lib/supabase.ts`, `betbros-react/src/lib/query-keys.ts`, `betbros-react/src/hooks/use-auth.ts`

- [ ] **Step 1: Create Supabase client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Create query key factory**

Create `src/lib/query-keys.ts`:

```typescript
export const queryKeys = {
  auth: ['auth'] as const,
  users: ['users'] as const,
  gameWeeks: {
    all: ['gameWeeks'] as const,
    detail: (id: string) => ['gameWeeks', id] as const,
    current: ['gameWeeks', 'current'] as const,
  },
  games: {
    byWeek: (weekId: string) => ['games', weekId] as const,
  },
  bets: {
    byWeek: (weekId: string) => ['bets', weekId] as const,
    byWeekAndUser: (weekId: string, userId: string) => ['bets', weekId, userId] as const,
  },
  leaderboard: ['leaderboard'] as const,
  stats: {
    financial: ['stats', 'financial'] as const,
    summary: ['stats', 'summary'] as const,
    users: ['stats', 'users'] as const,
  },
  teams: ['teams'] as const,
}
```

- [ ] **Step 3: Create useAuth hook**

Create `src/hooks/use-auth.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setState({ user: null, loading: false })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setState({ user: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authId)
      .single()

    if (error || !data) {
      setState({ user: null, loading: false })
      return
    }

    setState({ user: data as User, loading: false })
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    isAdmin: state.user?.is_admin ?? false,
    signIn,
    signOut,
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/query-keys.ts src/hooks/use-auth.ts
git commit -m "feat: Supabase client, query keys, and auth hook"
```

---

## Task 8: Router, Layout, and Route Guards

**Files:**
- Create: `betbros-react/src/App.tsx`, `betbros-react/src/components/layout.tsx`, `betbros-react/src/components/protected-route.tsx`, `betbros-react/src/components/admin-route.tsx`

- [ ] **Step 1: Create ProtectedRoute**

Create `src/components/protected-route.tsx`:

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Laddar...</div>
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
```

- [ ] **Step 2: Create AdminRoute**

Create `src/components/admin-route.tsx`:

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Laddar...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
```

- [ ] **Step 3: Create Layout**

Create `src/components/layout.tsx`:

```typescript
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: 'Hem' },
  { to: '/valj-matcher', label: 'Matcher' },
  { to: '/resultat', label: 'Resultat' },
  { to: '/tabell', label: 'Tabell' },
  { to: '/statistik', label: 'Statistik' },
  { to: '/historik', label: 'Historik' },
]

export function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold">BetBros</Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  location.pathname === to && 'bg-accent',
                )}
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  location.pathname === '/admin' && 'bg-accent',
                )}
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.display_name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Logga ut
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Set up Router in App.tsx**

Update `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './components/protected-route'
import { AdminRoute } from './components/admin-route'
import { Layout } from './components/layout'
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'
import { GameSelectionPage } from './pages/game-selection'
import { EnterResultsPage } from './pages/enter-results'
import { LeaderboardPage } from './pages/leaderboard'
import { StatisticsPage } from './pages/statistics'
import { HistoryPage } from './pages/history'
import { AdminPage } from './pages/admin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/valj-matcher" element={<GameSelectionPage />} />
              <Route path="/resultat" element={<EnterResultsPage />} />
              <Route path="/tabell" element={<LeaderboardPage />} />
              <Route path="/statistik" element={<StatisticsPage />} />
              <Route path="/historik" element={<HistoryPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 5: Create placeholder pages**

Create each page file (`src/pages/login.tsx`, `dashboard.tsx`, `game-selection.tsx`, `enter-results.tsx`, `leaderboard.tsx`, `statistics.tsx`, `history.tsx`, `admin.tsx`) with a placeholder:

```typescript
// src/pages/login.tsx
export function LoginPage() {
  return <div>Login</div>
}

// src/pages/dashboard.tsx
export function DashboardPage() {
  return <div>Dashboard</div>
}

// Repeat for all pages...
```

- [ ] **Step 6: Update main.tsx entry point**

Update `src/main.tsx`:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Verify app compiles and routes work**

```bash
npm run dev
```

Expected: App starts, routes render placeholder pages, unauthenticated users redirect to /login.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: router, layout, auth guards, and placeholder pages"
```

---

## Task 9: Data Hooks

**Files:**
- Create: `betbros-react/src/hooks/use-game-weeks.ts`, `use-games.ts`, `use-bets.ts`, `use-leaderboard.ts`, `use-stats.ts`, `use-teams.ts`

- [ ] **Step 1: Create useGameWeeks hook**

Create `src/hooks/use-game-weeks.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { getCurrentWeekNumber } from '../lib/rotation'
import { BASE_DATE } from '../lib/constants'
import type { GameWeek } from '../types'

export function useGameWeeks() {
  return useQuery({
    queryKey: queryKeys.gameWeeks.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_weeks')
        .select('*')
        .order('is_catchup', { ascending: true })
        .order('week_number', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as GameWeek[]
    },
  })
}

export function useCurrentGameWeek() {
  const weekNumber = getCurrentWeekNumber(BASE_DATE)

  return useQuery({
    queryKey: queryKeys.gameWeeks.current,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_weeks')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('is_catchup', false)
        .maybeSingle()
      if (error) throw error
      return data as GameWeek | null
    },
  })
}

export function useUpdateWeekNetProfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ weekId, netProfit }: { weekId: string; netProfit: number | null }) => {
      const { data, error } = await supabase
        .from('game_weeks')
        .update({ net_profit: netProfit, is_complete: netProfit != null })
        .eq('id', weekId)
        .select()
        .single()
      if (error) throw error
      return data as GameWeek
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.current })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.financial })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
    },
  })
}
```

- [ ] **Step 2: Create useGames hook**

Create `src/hooks/use-games.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import type { Game, BetType } from '../types'

export function useGames(weekId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.byWeek(weekId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_week_id', weekId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Game[]
    },
    enabled: !!weekId,
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (game: {
      game_week_id: string
      home_team: string
      away_team: string
      bet_kind: BetType
      over_under_line?: number | null
      asian_handicap_line?: number | null
      handicap_3way_line?: number | null
    }) => {
      const { data, error } = await supabase.from('games').insert(game).select().single()
      if (error) throw error
      return data as Game
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byWeek(data.game_week_id) })
    },
  })
}

export function useDeleteGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameId, weekId }: { gameId: string; weekId: string }) => {
      const { error } = await supabase.from('games').delete().eq('id', gameId)
      if (error) throw error
      return weekId
    },
    onSuccess: (weekId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byWeek(weekId) })
    },
  })
}
```

- [ ] **Step 3: Create useBets hook**

Create `src/hooks/use-bets.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { WEEKLY_STAKE } from '../lib/constants'
import type { Bet, BetType, BetStatus } from '../types'

export function useBets(weekId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bets.byWeek(weekId ?? ''),
    queryFn: async () => {
      // Get game IDs for this week first
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('game_week_id', weekId!)
      if (gamesError) throw gamesError

      const gameIds = games.map((g) => g.id)
      if (gameIds.length === 0) return [] as Bet[]

      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .in('game_id', gameIds)
      if (error) throw error
      return data as Bet[]
    },
    enabled: !!weekId,
  })
}

export function usePlaceBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      gameId,
      userId,
      prediction,
      predictedHomeScore,
      predictedAwayScore,
      gameCount,
      weekId,
    }: {
      gameId: string
      userId: string
      prediction: BetType
      predictedHomeScore?: number | null
      predictedAwayScore?: number | null
      gameCount: number
      weekId: string
    }) => {
      const stake = gameCount > 0 ? WEEKLY_STAKE / gameCount : WEEKLY_STAKE

      const { data, error } = await supabase
        .from('bets')
        .upsert(
          {
            game_id: gameId,
            user_id: userId,
            prediction,
            predicted_home_score: predictedHomeScore ?? null,
            predicted_away_score: predictedAwayScore ?? null,
            stake,
            status: 'pending' as BetStatus,
            placed_at: new Date().toISOString(),
            scored_at: null,
          },
          { onConflict: 'game_id,user_id' },
        )
        .select()
        .single()
      if (error) throw error
      return { bet: data as Bet, weekId }
    },
    onSuccess: ({ weekId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bets.byWeek(weekId) })
    },
  })
}
```

- [ ] **Step 4: Create useLeaderboard hook**

Create `src/hooks/use-leaderboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { WEEKLY_STAKE } from '../lib/constants'
import { GameStatus, BetStatus } from '../types'
import type { User, GameWeek, Game, Bet } from '../types'

interface LeaderboardEntry {
  user: User
  net_profit: number
  total_bets: number
  total_wins: number
  accuracy_percent: number
}

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: async () => {
      // Fetch all data in parallel
      const [usersRes, weeksRes, gamesRes, betsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('game_weeks').select('*'),
        supabase.from('games').select('*'),
        supabase.from('bets').select('*'),
      ])

      if (usersRes.error) throw usersRes.error
      if (weeksRes.error) throw weeksRes.error
      if (gamesRes.error) throw gamesRes.error
      if (betsRes.error) throw betsRes.error

      const users = usersRes.data as User[]
      const weeks = weeksRes.data as GameWeek[]
      const games = gamesRes.data as Game[]
      const bets = betsRes.data as Bet[]

      // Completed weeks: all games completed and net_profit set
      const completedWeekIds = new Set(
        weeks
          .filter((w) => {
            const weekGames = games.filter((g) => g.game_week_id === w.id)
            return (
              weekGames.length > 0 &&
              weekGames.every((g) => g.status === GameStatus.Completed && g.home_score != null) &&
              w.net_profit != null
            )
          })
          .map((w) => w.id),
      )

      return users
        .map((user) => {
          const userWeeks = weeks.filter(
            (w) => w.game_selector_id === user.id && completedWeekIds.has(w.id),
          )
          const netProfit = userWeeks.reduce((sum, w) => sum + (w.net_profit ?? 0), 0)

          const scoredBets = bets.filter(
            (b) => b.user_id === user.id && b.scored_at != null,
          )
          const totalWins = scoredBets.filter(
            (b) => b.status === BetStatus.Won || b.status === BetStatus.Refunded,
          ).length

          return {
            user,
            net_profit: netProfit,
            total_bets: scoredBets.length,
            total_wins: totalWins,
            accuracy_percent: scoredBets.length > 0 ? (totalWins / scoredBets.length) * 100 : 0,
          } satisfies LeaderboardEntry
        })
        .sort((a, b) => b.net_profit - a.net_profit)
    },
  })
}
```

- [ ] **Step 5: Create useStats hook**

Create `src/hooks/use-stats.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import { WEEKLY_STAKE } from '../lib/constants'
import { GameStatus } from '../types'
import type { User, GameWeek, Game, FinancialStats, FinancialSummary } from '../types'

export function useFinancialStats() {
  return useQuery({
    queryKey: queryKeys.stats.financial,
    queryFn: async () => {
      const [usersRes, weeksRes, gamesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('game_weeks').select('*'),
        supabase.from('games').select('*'),
      ])

      if (usersRes.error) throw usersRes.error
      if (weeksRes.error) throw weeksRes.error
      if (gamesRes.error) throw gamesRes.error

      const users = usersRes.data as User[]
      const weeks = weeksRes.data as GameWeek[]
      const games = gamesRes.data as Game[]

      const completedWeeks = weeks.filter((w) => {
        const weekGames = games.filter((g) => g.game_week_id === w.id)
        return (
          weekGames.length > 0 &&
          weekGames.every((g) => g.status === GameStatus.Completed && g.home_score != null) &&
          w.net_profit != null
        )
      })

      const stats: Record<string, FinancialStats> = {}

      for (const user of users) {
        const userWeeks = completedWeeks.filter((w) => w.game_selector_id === user.id)
        const totalGamesPlayed = userWeeks.reduce(
          (sum, w) => sum + games.filter((g) => g.game_week_id === w.id).length,
          0,
        )
        let totalBet = userWeeks.length * WEEKLY_STAKE
        const totalWon = userWeeks
          .filter((w) => w.net_profit != null && w.net_profit > 0)
          .reduce((sum, w) => sum + w.net_profit!, 0)
        const totalLost = userWeeks
          .filter((w) => w.net_profit != null && w.net_profit < 0)
          .reduce((sum, w) => sum + Math.abs(w.net_profit!), 0)
        const netProfit = userWeeks.reduce((sum, w) => sum + (w.net_profit ?? 0), 0)

        if (netProfit < 0 && Math.abs(netProfit) > totalBet) {
          totalBet = Math.abs(netProfit)
        }

        let roi = totalBet > 0 ? (netProfit / totalBet) * 100 : 0
        if (roi < -100) roi = -100

        stats[user.id] = {
          total_bet: totalBet,
          total_won: totalWon,
          total_lost: totalLost,
          net_profit: netProfit,
          roi_percent: roi,
          weeks_participated: userWeeks.length,
          total_games_played: totalGamesPlayed,
        }
      }

      return { stats, users }
    },
  })
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: async () => {
      const [weeksRes, gamesRes] = await Promise.all([
        supabase.from('game_weeks').select('*'),
        supabase.from('games').select('*'),
      ])

      if (weeksRes.error) throw weeksRes.error
      if (gamesRes.error) throw gamesRes.error

      const weeks = weeksRes.data as GameWeek[]
      const games = gamesRes.data as Game[]

      const completedWeeks = weeks.filter((w) => {
        const weekGames = games.filter((g) => g.game_week_id === w.id)
        return (
          weekGames.length > 0 &&
          weekGames.every((g) => g.status === GameStatus.Completed && g.home_score != null) &&
          w.net_profit != null
        )
      })

      const totalWon = completedWeeks
        .filter((w) => w.net_profit! > 0)
        .reduce((sum, w) => sum + w.net_profit!, 0)
      const totalLost = completedWeeks
        .filter((w) => w.net_profit! < 0)
        .reduce((sum, w) => sum + Math.abs(w.net_profit!), 0)
      const netProfit = completedWeeks.reduce((sum, w) => sum + (w.net_profit ?? 0), 0)
      const totalBet = completedWeeks.length * WEEKLY_STAKE
      const roi = totalBet > 0 ? (netProfit / totalBet) * 100 : 0

      return {
        total_bet: totalBet,
        total_won: totalWon,
        total_lost: totalLost,
        net_profit: netProfit,
        roi_percent: roi,
        total_weeks: completedWeeks.length,
        total_balance: totalBet + netProfit,
      } satisfies FinancialSummary
    },
  })
}
```

- [ ] **Step 6: Create useTeams hook**

Create `src/hooks/use-teams.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/query-keys'
import type { Team } from '../types'

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('league')
        .order('name')
      if (error) throw error
      return data as Team[]
    },
    staleTime: Infinity, // Teams rarely change
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/
git commit -m "feat: data hooks for game weeks, games, bets, leaderboard, stats, and teams"
```

---

## Task 10: Reusable Components

**Files:**
- Create: `betbros-react/src/components/game-card.tsx`, `bet-picker.tsx`, `week-header.tsx`, `stats-card.tsx`, `team-autocomplete.tsx`
- Create: `betbros-react/src/utils/format.ts`

- [ ] **Step 1: Create format utilities**

Create `src/utils/format.ts`:

```typescript
export function formatCurrency(amount: number): string {
  return `${amount.toFixed(0)} kr`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE')
}

export function betTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    home_win: '1',
    draw: 'X',
    away_win: '2',
    over: 'Över',
    under: 'Under',
    over_or_under: 'Över/Under',
    exact_score: 'Exakt resultat',
    home_win_to_nil: '1 till noll',
    away_win_to_nil: '2 till noll',
    home_win_dnb: '1 DNB',
    away_win_dnb: '2 DNB',
    home_win_ah: '1 AH',
    away_win_ah: '2 AH',
    home_win_h3w: '1 H3W',
    draw_h3w: 'X H3W',
    away_win_h3w: '2 H3W',
  }
  return labels[type] ?? type
}

export function betStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Väntar',
    won: 'Vunnen',
    lost: 'Förlorad',
    refunded: 'Återbetald',
  }
  return labels[status] ?? status
}

export function gameKindLabel(betKind: string): string {
  const labels: Record<string, string> = {
    home_win: '1X2',
    draw: '1X2',
    away_win: '1X2',
    over_or_under: 'Över/Under',
    exact_score: 'Exakt resultat',
    home_win_ah: 'Asian Handicap',
    away_win_ah: 'Asian Handicap',
    home_win_h3w: 'Handicap 3-vägs',
    draw_h3w: 'Handicap 3-vägs',
    away_win_h3w: 'Handicap 3-vägs',
  }
  return labels[betKind] ?? betKind
}
```

- [ ] **Step 2: Create StatsCard**

Create `src/components/stats-card.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

interface StatsCardProps {
  title: string
  value: string
  className?: string
}

export function StatsCard({ title, value, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold')}>{value}</p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create WeekHeader**

Create `src/components/week-header.tsx`:

```typescript
import type { GameWeek, User } from '../types'
import { formatDate } from '../utils/format'
import { Badge } from './ui/badge'

interface WeekHeaderProps {
  week: GameWeek
  selector: User | undefined
}

export function WeekHeader({ week, selector }: WeekHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold">
        {week.is_catchup ? 'Ikappvecka' : `Vecka ${week.week_number}`}
      </h2>
      {week.is_cancelled && <Badge variant="destructive">Inställd</Badge>}
      {selector && (
        <span className="text-sm text-muted-foreground">
          Väljare: {selector.display_name}
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        {formatDate(week.start_date)} — {formatDate(week.end_date)}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Create GameCard**

Create `src/components/game-card.tsx`:

```typescript
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
              <span className="font-bold">
                {game.home_score} - {game.away_score}
              </span>
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
```

- [ ] **Step 5: Create BetPicker**

Create `src/components/bet-picker.tsx`:

```typescript
import { useState } from 'react'
import type { Game, BetType as BetTypeT } from '../types'
import { BetType } from '../types'
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
          <Input
            type="number"
            min={0}
            className="w-16"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
          />
        </div>
        <span className="pb-2">-</span>
        <div>
          <Label className="text-xs">{game.away_team}</Label>
          <Input
            type="number"
            min={0}
            className="w-16"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          disabled={homeScore === '' || awayScore === ''}
          onClick={() => onPick(BetType.ExactScore, parseInt(homeScore), parseInt(awayScore))}
        >
          Spela
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={currentPrediction === option ? 'default' : 'outline'}
          className={cn(currentPrediction === option && 'bg-primary')}
          onClick={() => onPick(option)}
        >
          {betTypeLabel(option)}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Create TeamAutocomplete**

Create `src/components/team-autocomplete.tsx`:

```typescript
import { useState, useMemo } from 'react'
import { useTeams } from '../hooks/use-teams'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface TeamAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TeamAutocomplete({ value, onChange, placeholder = 'Sök lag...' }: TeamAutocompleteProps) {
  const { data: teams = [] } = useTeams()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return teams.slice(0, 20)
    const lower = search.toLowerCase()
    return teams.filter((t) => t.name.toLowerCase().includes(lower)).slice(0, 20)
  }, [teams, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder="Sök..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.map((team) => (
            <button
              key={team.id}
              className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                onChange(team.name)
                setOpen(false)
                setSearch('')
              }}
            >
              {team.name}
              <span className="ml-2 text-xs text-muted-foreground">{team.league}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/ src/utils/
git commit -m "feat: reusable components - GameCard, BetPicker, WeekHeader, StatsCard, TeamAutocomplete"
```

---

## Task 11: Login Page

**Files:**
- Modify: `betbros-react/src/pages/login.tsx`

- [ ] **Step 1: Implement Login page**

Update `src/pages/login.tsx`:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inloggning misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">BetBros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <p>{error}</p>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loggar in...' : 'Logga in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify login page renders**

```bash
npm run dev
```

Navigate to `/login`. Expected: Login form renders.

- [ ] **Step 3: Commit**

```bash
git add src/pages/login.tsx
git commit -m "feat: login page"
```

---

## Task 12: Dashboard Page

**Files:**
- Modify: `betbros-react/src/pages/dashboard.tsx`

- [ ] **Step 1: Implement Dashboard**

Update `src/pages/dashboard.tsx`:

```typescript
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { useBets } from '../hooks/use-bets'
import { useLeaderboard } from '../hooks/use-leaderboard'
import { WeekHeader } from '../components/week-header'
import { GameCard } from '../components/game-card'
import { StatsCard } from '../components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatCurrency } from '../utils/format'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: week, isLoading: weekLoading } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const { data: leaderboard = [] } = useLeaderboard()

  if (weekLoading) return <div>Laddar...</div>

  const myEntry = leaderboard.find((e) => e.user.id === user?.id)
  const myRank = leaderboard.findIndex((e) => e.user.id === user?.id) + 1
  const isSelector = week?.game_selector_id === user?.id
  const selector = leaderboard.find((e) => e.user.id === week?.game_selector_id)?.user

  return (
    <div className="space-y-6">
      {/* Week info */}
      {week && <WeekHeader week={week} selector={selector} />}
      {!week && <p className="text-muted-foreground">Ingen aktiv vecka</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Din nettovinst"
          value={myEntry ? formatCurrency(myEntry.net_profit) : '0 kr'}
        />
        <StatsCard
          title="Placering"
          value={myRank > 0 ? `#${myRank}` : '-'}
        />
      </div>

      {/* Games & bets */}
      {week && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Matcher</CardTitle>
            {isSelector && games.length === 0 && (
              <Link to="/valj-matcher">
                <Button size="sm">Välj matcher</Button>
              </Link>
            )}
            {games.length > 0 && (
              <Link to="/valj-matcher">
                <Button size="sm" variant="outline">Lägg spel</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {games.length === 0 && (
              <p className="text-sm text-muted-foreground">Inga matcher valda ännu.</p>
            )}
            {games.map((game) => {
              const myBet = bets.find((b) => b.game_id === game.id && b.user_id === user?.id)
              return <GameCard key={game.id} game={game} bet={myBet} />
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/dashboard.tsx
git commit -m "feat: dashboard page with week info, stats, and games"
```

---

## Task 13: Game Selection Page

**Files:**
- Modify: `betbros-react/src/pages/game-selection.tsx`

- [ ] **Step 1: Implement GameSelection page**

Update `src/pages/game-selection.tsx`:

```typescript
import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek } from '../hooks/use-game-weeks'
import { useGames, useCreateGame, useDeleteGame } from '../hooks/use-games'
import { useBets, usePlaceBet } from '../hooks/use-bets'
import { WeekHeader } from '../components/week-header'
import { GameCard } from '../components/game-card'
import { BetPicker } from '../components/bet-picker'
import { TeamAutocomplete } from '../components/team-autocomplete'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { BetType } from '../types'
import type { BetType as BetTypeT } from '../types'
import { MAX_GAMES_PER_WEEK } from '../lib/constants'
import { gameKindLabel, betTypeLabel } from '../utils/format'

const GAME_KIND_OPTIONS: BetTypeT[] = [
  BetType.HomeWin,
  BetType.OverOrUnder,
  BetType.ExactScore,
  BetType.HomeWinAH,
  BetType.HomeWinH3W,
]

export function GameSelectionPage() {
  const { user } = useAuth()
  const { data: week } = useCurrentGameWeek()
  const { data: games = [] } = useGames(week?.id)
  const { data: bets = [] } = useBets(week?.id)
  const createGame = useCreateGame()
  const deleteGame = useDeleteGame()
  const placeBet = usePlaceBet()

  const isSelector = week?.game_selector_id === user?.id

  // New game form state
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [betKind, setBetKind] = useState<BetTypeT>(BetType.HomeWin)
  const [line, setLine] = useState('')

  async function handleCreateGame() {
    if (!week || !homeTeam || !awayTeam) return

    await createGame.mutateAsync({
      game_week_id: week.id,
      home_team: homeTeam,
      away_team: awayTeam,
      bet_kind: betKind,
      over_under_line: betKind === BetType.OverOrUnder ? parseFloat(line) : null,
      asian_handicap_line: betKind === BetType.HomeWinAH ? parseFloat(line) : null,
      handicap_3way_line: betKind === BetType.HomeWinH3W ? parseFloat(line) : null,
    })

    setHomeTeam('')
    setAwayTeam('')
    setBetKind(BetType.HomeWin)
    setLine('')
  }

  async function handlePlaceBet(gameId: string, prediction: BetTypeT, homeScore?: number, awayScore?: number) {
    if (!user || !week) return

    await placeBet.mutateAsync({
      gameId,
      userId: user.id,
      prediction,
      predictedHomeScore: homeScore ?? null,
      predictedAwayScore: awayScore ?? null,
      gameCount: games.length,
      weekId: week.id,
    })
  }

  const needsLine = betKind === BetType.OverOrUnder || betKind === BetType.HomeWinAH || betKind === BetType.HomeWinH3W

  return (
    <div className="space-y-6">
      {week && <WeekHeader week={week} selector={undefined} />}

      {/* Game creation form (selector only) */}
      {isSelector && games.length < MAX_GAMES_PER_WEEK && (
        <Card>
          <CardHeader>
            <CardTitle>Lägg till match ({games.length}/{MAX_GAMES_PER_WEEK})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hemmalag</Label>
                <TeamAutocomplete value={homeTeam} onChange={setHomeTeam} />
              </div>
              <div className="space-y-2">
                <Label>Bortalag</Label>
                <TeamAutocomplete value={awayTeam} onChange={setAwayTeam} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Speltyp</Label>
                <Select value={betKind} onValueChange={(v) => setBetKind(v as BetTypeT)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_KIND_OPTIONS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {gameKindLabel(kind)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsLine && (
                <div className="space-y-2">
                  <Label>Linje</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    placeholder="t.ex. 2.5"
                  />
                </div>
              )}
            </div>
            <Button onClick={handleCreateGame} disabled={!homeTeam || !awayTeam || (needsLine && !line)}>
              Lägg till match
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Games + bet pickers */}
      {games.map((game) => {
        const myBet = bets.find((b) => b.game_id === game.id && b.user_id === user?.id)

        return (
          <Card key={game.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <GameCard game={game} showScore={false} />
                {isSelector && !bets.some((b) => b.game_id === game.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGame.mutate({ gameId: game.id, weekId: week!.id })}
                  >
                    Ta bort
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Ditt spel:</Label>
                <BetPicker
                  game={game}
                  currentPrediction={myBet?.prediction}
                  onPick={(pred, hs, as_) => handlePlaceBet(game.id, pred, hs, as_)}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/game-selection.tsx
git commit -m "feat: game selection page with game creation and bet placing"
```

---

## Task 14: Enter Results Page

**Files:**
- Modify: `betbros-react/src/pages/enter-results.tsx`

- [ ] **Step 1: Implement Enter Results page**

Update `src/pages/enter-results.tsx`:

```typescript
import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useCurrentGameWeek, useUpdateWeekNetProfit } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { WeekHeader } from '../components/week-header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { GameStatus } from '../types'
import { supabase } from '../lib/supabase'
import { scoreBet } from '../lib/scoring'
import { betTypeLabel, gameKindLabel } from '../utils/format'

export function EnterResultsPage() {
  const { user } = useAuth()
  const { data: week } = useCurrentGameWeek()
  const { data: games = [], refetch: refetchGames } = useGames(week?.id)
  const updateNetProfit = useUpdateWeekNetProfit()

  const isSelector = week?.game_selector_id === user?.id
  const allCompleted = games.length > 0 && games.every((g) => g.status === GameStatus.Completed)

  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [netProfit, setNetProfit] = useState(week?.net_profit?.toString() ?? '')
  const [saving, setSaving] = useState<string | null>(null)

  function getScores(gameId: string) {
    return scores[gameId] ?? { home: '', away: '' }
  }

  function setGameScore(gameId: string, field: 'home' | 'away', value: string) {
    setScores((prev) => ({
      ...prev,
      [gameId]: { ...getScores(gameId), [field]: value },
    }))
  }

  async function handleEnterResult(gameId: string) {
    const { home, away } = getScores(gameId)
    if (home === '' || away === '') return

    setSaving(gameId)
    try {
      const { error } = await supabase.functions.invoke('enter-results', {
        body: {
          game_id: gameId,
          home_score: parseInt(home),
          away_score: parseInt(away),
        },
      })
      if (error) throw error
      await refetchGames()
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveNetProfit() {
    if (!week || netProfit === '') return
    await updateNetProfit.mutateAsync({
      weekId: week.id,
      netProfit: parseFloat(netProfit),
    })
  }

  if (!isSelector) {
    return <p className="text-muted-foreground">Bara veckans väljare kan mata in resultat.</p>
  }

  return (
    <div className="space-y-6">
      {week && <WeekHeader week={week} selector={undefined} />}

      {games.map((game) => {
        const isCompleted = game.status === GameStatus.Completed
        const { home, away } = getScores(game.id)

        return (
          <Card key={game.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {game.home_team} vs {game.away_team}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {gameKindLabel(game.bet_kind)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCompleted ? (
                <p className="font-medium">
                  Resultat: {game.home_score} - {game.away_score}
                </p>
              ) : (
                <div className="flex items-end gap-2">
                  <div>
                    <Label className="text-xs">Hemma</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-16"
                      value={home}
                      onChange={(e) => setGameScore(game.id, 'home', e.target.value)}
                    />
                  </div>
                  <span className="pb-2">-</span>
                  <div>
                    <Label className="text-xs">Borta</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-16"
                      value={away}
                      onChange={(e) => setGameScore(game.id, 'away', e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={home === '' || away === '' || saving === game.id}
                    onClick={() => handleEnterResult(game.id)}
                  >
                    {saving === game.id ? 'Sparar...' : 'Spara'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Net profit entry */}
      {allCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Veckoresultat</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Nettoresultat (kr)</Label>
              <Input
                type="number"
                value={netProfit}
                onChange={(e) => setNetProfit(e.target.value)}
                placeholder="t.ex. 150 eller -200"
              />
            </div>
            <Button onClick={handleSaveNetProfit} disabled={netProfit === ''}>
              Spara resultat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/enter-results.tsx
git commit -m "feat: enter results page with scoring via Edge Function"
```

---

## Task 15: Leaderboard Page

**Files:**
- Modify: `betbros-react/src/pages/leaderboard.tsx`

- [ ] **Step 1: Implement Leaderboard**

Update `src/pages/leaderboard.tsx`:

```typescript
import { useLeaderboard } from '../hooks/use-leaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useLeaderboard()

  if (isLoading) return <div>Laddar...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabell</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Spelare</TableHead>
              <TableHead className="text-right">Vinst</TableHead>
              <TableHead className="text-right">Spel</TableHead>
              <TableHead className="text-right">Träff%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((entry, i) => (
              <TableRow key={entry.user.id}>
                <TableCell className="font-medium">
                  {i === 0 ? '🏆' : i + 1}
                </TableCell>
                <TableCell>{entry.user.display_name}</TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium',
                    entry.net_profit > 0 && 'text-green-600',
                    entry.net_profit < 0 && 'text-red-600',
                  )}
                >
                  {formatCurrency(entry.net_profit)}
                </TableCell>
                <TableCell className="text-right">{entry.total_bets}</TableCell>
                <TableCell className="text-right">{formatPercent(entry.accuracy_percent)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/leaderboard.tsx
git commit -m "feat: leaderboard page"
```

---

## Task 16: Statistics Page

**Files:**
- Modify: `betbros-react/src/pages/statistics.tsx`

- [ ] **Step 1: Implement Statistics**

Update `src/pages/statistics.tsx`:

```typescript
import { useFinancialStats, useFinancialSummary } from '../hooks/use-stats'
import { StatsCard } from '../components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatCurrency, formatPercent } from '../utils/format'
import { cn } from '../lib/utils'

export function StatisticsPage() {
  const { data: financialData, isLoading: statsLoading } = useFinancialStats()
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary()

  if (statsLoading || summaryLoading) return <div>Laddar...</div>

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatsCard title="Totalt insatsat" value={formatCurrency(summary.total_bet)} />
          <StatsCard title="Totalt vunnet" value={formatCurrency(summary.total_won)} />
          <StatsCard title="Totalt förlorat" value={formatCurrency(summary.total_lost)} />
          <StatsCard
            title="Nettoresultat"
            value={formatCurrency(summary.net_profit)}
            className={cn(summary.net_profit >= 0 ? 'border-green-200' : 'border-red-200')}
          />
          <StatsCard title="Total balans" value={formatCurrency(summary.total_balance)} />
          <StatsCard title="ROI" value={formatPercent(summary.roi_percent)} />
          <StatsCard title="Veckor" value={summary.total_weeks.toString()} />
        </div>
      )}

      {/* Per-player stats */}
      {financialData && (
        <Card>
          <CardHeader>
            <CardTitle>Per spelare</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spelare</TableHead>
                  <TableHead className="text-right">Insatsat</TableHead>
                  <TableHead className="text-right">Vunnet</TableHead>
                  <TableHead className="text-right">Förlorat</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Veckor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialData.users.map((user) => {
                  const s = financialData.stats[user.id]
                  if (!s) return null
                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.display_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.total_bet)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.total_won)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.total_lost)}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium',
                          s.net_profit > 0 && 'text-green-600',
                          s.net_profit < 0 && 'text-red-600',
                        )}
                      >
                        {formatCurrency(s.net_profit)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(s.roi_percent)}</TableCell>
                      <TableCell className="text-right">{s.weeks_participated}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/statistics.tsx
git commit -m "feat: statistics page with summary and per-player financial stats"
```

---

## Task 17: History Page

**Files:**
- Modify: `betbros-react/src/pages/history.tsx`

- [ ] **Step 1: Implement History page**

Update `src/pages/history.tsx`:

```typescript
import { useState } from 'react'
import { useGameWeeks } from '../hooks/use-game-weeks'
import { useGames } from '../hooks/use-games'
import { useBets } from '../hooks/use-bets'
import { GameCard } from '../components/game-card'
import { WeekHeader } from '../components/week-header'
import { Card, CardContent } from '../components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { formatCurrency } from '../utils/format'
import { supabase } from '../lib/supabase'
import type { User, Game, Bet } from '../types'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export function HistoryPage() {
  const { data: weeks = [], isLoading } = useGameWeeks()
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return data as User[]
    },
  })

  // Fetch all games and bets for display
  const { data: allGames = [] } = useQuery({
    queryKey: ['all-games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('created_at')
      if (error) throw error
      return data as Game[]
    },
  })

  const { data: allBets = [] } = useQuery({
    queryKey: ['all-bets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bets').select('*')
      if (error) throw error
      return data as Bet[]
    },
  })

  if (isLoading) return <div>Laddar...</div>

  const sortedWeeks = [...weeks].reverse()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historik</h1>
      <Accordion type="single" collapsible>
        {sortedWeeks.map((week) => {
          const weekGames = allGames.filter((g) => g.game_week_id === week.id)
          const selector = users.find((u) => u.id === week.game_selector_id)

          return (
            <AccordionItem key={week.id} value={week.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <WeekHeader week={week} selector={selector} />
                  {week.net_profit != null && (
                    <span className={week.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(week.net_profit)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-4">
                  {weekGames.map((game) => (
                    <div key={game.id} className="space-y-2">
                      <GameCard game={game} />
                      <div className="grid grid-cols-2 gap-2 pl-4 md:grid-cols-4">
                        {users.map((u) => {
                          const bet = allBets.find(
                            (b) => b.game_id === game.id && b.user_id === u.id,
                          )
                          return (
                            <div key={u.id} className="text-sm">
                              <span className="font-medium">{u.display_name}:</span>{' '}
                              {bet ? (
                                <GameCard game={game} bet={bet} showScore={false} />
                              ) : (
                                <span className="text-muted-foreground">Inget spel</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {weekGames.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {week.is_cancelled ? 'Inställd vecka' : 'Inga matcher'}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/history.tsx
git commit -m "feat: history page with expandable weeks and bet details"
```

---

## Task 18: Admin Page

**Files:**
- Modify: `betbros-react/src/pages/admin.tsx`

- [ ] **Step 1: Implement Admin page**

Update `src/pages/admin.tsx`:

```typescript
import { useState } from 'react'
import { useGameWeeks } from '../hooks/use-game-weeks'
import { useAuth } from '../hooks/use-auth'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert } from '../components/ui/alert'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import type { User } from '../types'

export function AdminPage() {
  const { data: weeks = [], refetch: refetchWeeks } = useGameWeeks()
  const queryClient = useQueryClient()

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return (data as User[]).sort((a, b) => a.rotation_order - b.rotation_order)
    },
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleCreateGameWeek() {
    setMessage(null)
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', {
        body: { type: 'next' },
      })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: 'Ny vecka skapad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Kunde inte skapa vecka' })
    }
  }

  async function handleCreateCancelledWeek() {
    const weekNumber = prompt('Veckonummer att ställa in:')
    if (!weekNumber) return
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', {
        body: { type: 'cancelled', week_number: parseInt(weekNumber) },
      })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: `Vecka ${weekNumber} inställd` })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  async function handleCreateCatchupWeek(userId: string) {
    try {
      const { error } = await supabase.functions.invoke('create-gameweek', {
        body: { type: 'catchup', selector_id: userId },
      })
      if (error) throw error
      await refetchWeeks()
      setMessage({ type: 'success', text: 'Ikappvecka skapad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  async function handleCascadeSelector(weekId: string, selectorId: string) {
    try {
      const { error } = await supabase.functions.invoke('cascade-selector', {
        body: { week_id: weekId, selector_id: selectorId },
      })
      if (error) throw error
      await refetchWeeks()
      queryClient.invalidateQueries({ queryKey: queryKeys.gameWeeks.all })
      setMessage({ type: 'success', text: 'Väljare uppdaterad med kaskad' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fel' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <p>{message.text}</p>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Åtgärder</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleCreateGameWeek}>Skapa nästa vecka</Button>
          <Button variant="outline" onClick={handleCreateCancelledWeek}>
            Ställ in vecka
          </Button>
          {users.map((u) => (
            <Button
              key={u.id}
              variant="outline"
              onClick={() => handleCreateCatchupWeek(u.id)}
            >
              Ikappvecka: {u.display_name}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Week overview */}
      <Card>
        <CardHeader>
          <CardTitle>Veckor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeks.map((week) => {
              const selector = users.find((u) => u.id === week.game_selector_id)
              return (
                <div key={week.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <span className="font-medium">
                      {week.is_catchup ? 'Ikapp' : `V${week.week_number}`}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {selector?.display_name ?? 'Okänd'}
                    </span>
                    {week.is_cancelled && (
                      <span className="ml-2 text-sm text-red-600">Inställd</span>
                    )}
                  </div>
                  <Select
                    value={week.game_selector_id}
                    onValueChange={(v) => handleCascadeSelector(week.id, v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin.tsx
git commit -m "feat: admin page with week management and cascade selector"
```

---

## Task 19: Edge Functions

**Files:**
- Create: `betbros-react/supabase/functions/_shared/scoring.ts`, `_shared/rotation.ts`
- Create: `betbros-react/supabase/functions/enter-results/index.ts`
- Create: `betbros-react/supabase/functions/create-gameweek/index.ts`
- Create: `betbros-react/supabase/functions/cascade-selector/index.ts`

- [ ] **Step 1: Copy shared logic for Edge Functions**

Create `supabase/functions/_shared/scoring.ts` — this is a copy of `src/lib/scoring.ts` with Deno-compatible imports:

```typescript
// Copy the full contents of src/lib/scoring.ts here,
// replacing the import paths:
// - '../types' -> './types.ts'
// Types are inlined since Edge Functions can't import from src/

export const BetType = {
  HomeWin: 'home_win', Draw: 'draw', AwayWin: 'away_win',
  Over: 'over', Under: 'under', OverOrUnder: 'over_or_under',
  ExactScore: 'exact_score',
  HomeWinToNil: 'home_win_to_nil', AwayWinToNil: 'away_win_to_nil',
  HomeWinDNB: 'home_win_dnb', AwayWinDNB: 'away_win_dnb',
  HomeWinAH: 'home_win_ah', AwayWinAH: 'away_win_ah',
  HomeWinH3W: 'home_win_h3w', DrawH3W: 'draw_h3w', AwayWinH3W: 'away_win_h3w',
} as const

export type BetType = (typeof BetType)[keyof typeof BetType]

export const BetStatus = {
  Pending: 'pending', Won: 'won', Lost: 'lost', Refunded: 'refunded',
} as const

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus]

export const GameStatus = {
  Scheduled: 'scheduled', Completed: 'completed',
} as const

// Full scoreBet function — identical to src/lib/scoring.ts
// (Copy the entire scoreBet, scoreAsianHandicap, scoreHandicap3Way functions)
```

The agent implementing this task should copy the full `scoreBet` function from `src/lib/scoring.ts` and paste it here with the inlined types above.

Create `supabase/functions/_shared/rotation.ts` — same pattern, copy from `src/lib/rotation.ts` with inlined types.

- [ ] **Step 2: Create enter-results Edge Function**

Create `supabase/functions/enter-results/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scoreBet, BetStatus, GameStatus, BetType } from '../_shared/scoring.ts'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Get the calling user
  const authHeader = req.headers.get('Authorization')!
  const { data: { user } } = await createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  ).auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { game_id, home_score, away_score } = await req.json()

  // Fetch game and its week
  const { data: game } = await supabase.from('games').select('*, game_weeks(*)').eq('id', game_id).single()
  if (!game) {
    return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 })
  }

  // Check authorization: must be week selector or admin
  const { data: callerUser } = await supabase.from('users').select('*').eq('id', user.id).single()
  const isSelector = game.game_weeks.game_selector_id === user.id
  const isAdmin = callerUser?.is_admin ?? false

  if (!isSelector && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 })
  }

  // Update game with scores
  const { error: updateError } = await supabase
    .from('games')
    .update({ home_score, away_score, status: 'completed' })
    .eq('id', game_id)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  // Score all bets for this game
  const { data: bets } = await supabase.from('bets').select('*').eq('game_id', game_id)

  const updatedGame = { ...game, home_score, away_score, status: GameStatus.Completed }

  for (const bet of bets ?? []) {
    const status = scoreBet(bet, updatedGame)
    await supabase
      .from('bets')
      .update({ status, scored_at: new Date().toISOString() })
      .eq('id', bet.id)
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

- [ ] **Step 3: Create create-gameweek Edge Function**

Create `supabase/functions/create-gameweek/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BASE_DATE = new Date(Date.UTC(2025, 10, 24))

function getSelectorForWeek(weekNumber: number, users: { id: string; rotation_order: number }[]) {
  const ordered = [...users].sort((a, b) => a.rotation_order - b.rotation_order)
  return ordered[(weekNumber - 1) % ordered.length]
}

function getWeekDates(weekNumber: number) {
  const start = new Date(BASE_DATE.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)
  return { start, end }
}

function getCurrentWeekNumber() {
  const days = (Date.now() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24)
  return days < 0 ? 1 : Math.floor(days / 7) + 1
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { type, week_number, selector_id } = await req.json()

  const { data: users } = await supabase.from('users').select('id, rotation_order').order('rotation_order')
  if (!users?.length) {
    return new Response(JSON.stringify({ error: 'No users found' }), { status: 500 })
  }

  if (type === 'next') {
    const currentWeekNumber = getCurrentWeekNumber()
    const nextWeekNumber = currentWeekNumber + 1

    // Check if current week exists to respect manual changes
    const { data: currentWeek } = await supabase
      .from('game_weeks')
      .select('*, users!game_weeks_game_selector_id_fkey(rotation_order)')
      .eq('week_number', currentWeekNumber)
      .eq('is_catchup', false)
      .maybeSingle()

    let selector
    if (currentWeek?.users) {
      const currentOrder = (currentWeek.users as { rotation_order: number }).rotation_order
      const ordered = [...users].sort((a, b) => a.rotation_order - b.rotation_order)
      selector = ordered[(currentOrder + 1) % ordered.length]
    } else {
      selector = getSelectorForWeek(nextWeekNumber, users)
    }

    const { start, end } = getWeekDates(nextWeekNumber)
    const { data, error } = await supabase.from('game_weeks').insert({
      week_number: nextWeekNumber,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      game_selector_id: selector.id,
    }).select().single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify(data))
  }

  if (type === 'cancelled') {
    const { start, end } = getWeekDates(week_number)
    const selector = getSelectorForWeek(week_number, users)

    // Check if week exists
    const { data: existing } = await supabase
      .from('game_weeks')
      .select('*')
      .eq('week_number', week_number)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('game_weeks')
        .update({ is_cancelled: true, is_complete: true })
        .eq('id', existing.id)
        .select().single()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      return new Response(JSON.stringify(data))
    }

    const { data, error } = await supabase.from('game_weeks').insert({
      week_number,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      game_selector_id: selector.id,
      is_cancelled: true,
      is_complete: true,
    }).select().single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify(data))
  }

  if (type === 'catchup') {
    const now = new Date()
    const day = now.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() + diff)
    weekStart.setUTCHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59) * 1000)

    const { data, error } = await supabase.from('game_weeks').insert({
      week_number: 0,
      start_date: weekStart.toISOString().split('T')[0],
      end_date: weekEnd.toISOString().split('T')[0],
      game_selector_id: selector_id,
      is_catchup: true,
    }).select().single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify(data))
  }

  return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })
})
```

- [ ] **Step 4: Create cascade-selector Edge Function**

Create `supabase/functions/cascade-selector/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { week_id, selector_id } = await req.json()

  // Get the target week
  const { data: week } = await supabase.from('game_weeks').select('*').eq('id', week_id).single()
  if (!week) {
    return new Response(JSON.stringify({ error: 'Week not found' }), { status: 404 })
  }

  // Get all users and the new selector
  const { data: users } = await supabase.from('users').select('*').order('rotation_order')
  const selector = users?.find((u) => u.id === selector_id)
  if (!selector) {
    return new Response(JSON.stringify({ error: 'Selector not found' }), { status: 404 })
  }

  // Update the target week
  await supabase.from('game_weeks').update({ game_selector_id: selector_id }).eq('id', week_id)

  // Get all future weeks
  const { data: futureWeeks } = await supabase
    .from('game_weeks')
    .select('*')
    .gt('week_number', week.week_number)
    .order('week_number')

  const ordered = [...(users ?? [])].sort((a, b) => a.rotation_order - b.rotation_order)
  const currentRotationOrder = selector.rotation_order

  for (const fw of futureWeeks ?? []) {
    // Check if week has games
    const { data: games } = await supabase.from('games').select('id').eq('game_week_id', fw.id).limit(1)
    if (games && games.length > 0) break

    const nextOrder = (currentRotationOrder + (fw.week_number - week.week_number)) % ordered.length
    const nextSelector = ordered[nextOrder]

    await supabase.from('game_weeks').update({ game_selector_id: nextSelector.id }).eq('id', fw.id)
  }

  return new Response(JSON.stringify({ success: true }))
})
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/
git commit -m "feat: Edge Functions for enter-results, create-gameweek, and cascade-selector"
```

---

## Task 20: Vercel Config and Final Wiring

**Files:**
- Create: `betbros-react/vercel.json`
- Modify: `betbros-react/.env.local.example`

- [ ] **Step 1: Create Vercel config for SPA routing**

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Verify the full app compiles**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All scoring, rotation, and validation tests pass.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: Vercel SPA routing config and final build verification"
```

---

## Task 21: End-to-End Smoke Test

- [ ] **Step 1: Start local Supabase**

```bash
npx supabase start
```

- [ ] **Step 2: Create test user in Supabase Auth**

Use Supabase Studio (localhost:54323) or CLI to create a test auth user, then insert corresponding row in `users` table.

- [ ] **Step 3: Create `.env.local` with local Supabase credentials**

```bash
cp .env.local.example .env.local
# Edit with local Supabase URL and anon key from `npx supabase status`
```

- [ ] **Step 4: Start dev server and manually test**

```bash
npm run dev
```

Test flow:
1. Login with test user
2. Verify dashboard loads
3. Navigate to all pages
4. Test the complete flow if admin: create week -> add games -> place bets -> enter results

- [ ] **Step 5: Final commit**

```bash
git add .env.local.example
git commit -m "chore: complete React migration - ready for Supabase project setup and Vercel deploy"
```
