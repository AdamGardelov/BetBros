# BetBros React Migration Design Spec

## Overview

Migrate BetBros from Blazor Server (.NET 10, MudBlazor, SQL Server, Azure) to a modern React stack (React 19, Vite, shadcn/ui, Supabase, Vercel). Same functionality, built with React best practices.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS |
| Routing | React Router |
| Server State | TanStack Query |
| Validation | Zod |
| Auth | Supabase Auth (email/password) |
| Database | Supabase Postgres |
| Server Logic | Supabase Edge Functions (Deno/TS) |
| Hosting | Vercel |

## Project Structure

```
betbros/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Route pages
│   ├── hooks/             # Custom hooks (useAuth, useGameWeek, useBets...)
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client
│   │   ├── scoring.ts     # ScoringEngine (shared with Edge Functions)
│   │   └── rotation.ts    # RotationCalculator
│   ├── types/             # TypeScript types (matches DB schema)
│   └── utils/             # Formatting, constants
├── supabase/
│   ├── migrations/        # SQL migrations
│   ├── functions/         # Edge Functions
│   │   ├── score-bets/
│   │   ├── create-gameweek/
│   │   └── enter-results/
│   └── seed.sql           # 4 users + 138 teams
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## Database Schema (Supabase Postgres)

### Users

Linked to Supabase Auth via `auth.users.id`. No password column.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | FK to auth.users |
| username | text | Unique, lowercase |
| display_name | text | e.g. "Gardelov" |
| rotation_order | int | 0-3 |
| is_admin | bool | |
| created_at | timestamptz | |

### Game Weeks

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| week_number | int | Sequential from week 1 |
| start_date | date | Monday |
| end_date | date | Sunday |
| game_selector_id | uuid (FK users) | Who picks games this week |
| is_complete | bool | |
| net_profit | numeric(10,2) | Entered by selector after games |
| is_cancelled | bool | |
| is_catchup | bool | |
| created_at | timestamptz | |

### Games

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| game_week_id | uuid (FK game_weeks) | Max 3 games per week |
| home_team | text | |
| away_team | text | |
| bet_kind | bet_type enum | |
| over_under_line | numeric(5,2) | Nullable, for O/U bets |
| asian_handicap_line | numeric(5,2) | Nullable, for AH bets |
| handicap_3way_line | numeric(5,2) | Nullable, for H3W bets |
| status | game_status enum | Scheduled / Completed |
| home_score | int | Nullable |
| away_score | int | Nullable |
| created_at | timestamptz | |

### Bets

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| game_id | uuid (FK games) | One bet per user per game |
| user_id | uuid (FK users) | |
| prediction | bet_type enum | Must match game's bet_kind category |
| predicted_home_score | int | Nullable, for ExactScore |
| predicted_away_score | int | Nullable, for ExactScore |
| stake | numeric(10,2) | 200kr / games_in_week |
| status | bet_status enum | Pending / Won / Lost / Refunded |
| placed_at | timestamptz | |
| scored_at | timestamptz | Nullable |

### Teams

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| league | text | PL, Championship, Serie A, etc. |

### Enums

```sql
-- bet_type: HomeWin, Draw, AwayWin, HomeWinToNil, AwayWinToNil,
--           HomeWinDNB, AwayWinDNB, Over, Under, ExactScore,
--           HomeWinAH, AwayWinAH, HomeWinH3W, DrawH3W, AwayWinH3W

-- bet_status: Pending, Won, Lost, Refunded

-- game_status: Scheduled, Completed
```

### Removed from current schema

- `payout`, `profit`, `points` on Bets (unused today)
- `result_entered_at`, `result_entered_by` on Games (Supabase has audit trails if needed)

## Auth & Row Level Security

### Auth Flow

1. `supabase.auth.signInWithPassword(email, password)` returns JWT
2. `useAuth()` hook wraps Supabase auth state, provides `user`, `isAdmin`, `signIn`, `signOut`
3. `ProtectedRoute` component checks auth state, redirects to `/login`
4. `AdminRoute` checks `users.is_admin`

### RLS Policies

**Read:** All authenticated users can read all tables. 4 friends, no secrets.

**Write:**
- Bets: insert/update only where `user_id = auth.uid()`
- Games: insert/update/delete only if caller is `game_selector_id` on the game's GameWeek
- GameWeeks: update `net_profit` only if caller is `game_selector_id`
- Admin operations bypass RLS via Edge Functions using `service_role` key

## Edge Functions

### `create-gameweek`

- Calculates next `week_number` based on existing weeks
- Rotates selector using `rotation.ts`
- Handles cancelled and catchup week creation
- Returns created GameWeek
- Called from frontend when navigating to current week and it doesn't exist yet

### `enter-results`

- Input: `game_id`, `home_score`, `away_score`
- Validates caller is week selector (or admin)
- Saves scores, sets game status = Completed
- Runs `scoring.ts` on all bets for that game
- Updates each bet's status (Won/Lost/Refunded) and `scored_at`

### `cascade-selector` (admin only)

- Changes selector on a week and cascades rotation forward to future weeks
- Only affects weeks with no games yet
- Uses `service_role` key to bypass RLS

## Shared Logic Modules

### `scoring.ts`

Ported from C# `ScoringEngine.cs`. Pure function:

```typescript
function scoreBet(bet: Bet, game: Game): BetStatus
```

Handles all 16 bet types:
- 1/X/2: Compare home vs away score
- Win to Nil: Win AND opponent scores 0
- Draw No Bet: Refund on draw
- Over/Under: Total goals vs line
- Exact Score: Both scores match
- Asian Handicap: Apply line, handle quarter-handicaps (0.25, 0.75) as split half-bets, refund on push
- Handicap 3-Way: Apply line, determine result on adjusted score

Used in:
- Frontend: preview scoring when entering results
- Edge Function `enter-results`: actual scoring

### `rotation.ts`

Ported from C# `RotationCalculator.cs`. Pure functions:

```typescript
function getSelectorForWeek(weekNumber: number, users: User[]): User
function getWeekDates(weekNumber: number, baseDate: Date): { start: Date, end: Date }
function getCurrentWeekNumber(baseDate: Date): number
```

Base date: November 24, 2025.

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password form |
| `/` | Dashboard | Current week, your stats, your bets, link to game selection |
| `/valj-matcher` | GameSelection | Step 1: Selector picks games. Step 2: All users place bets |
| `/resultat` | EnterResults | Selector enters scores, triggers scoring, enters week net profit |
| `/tabell` | Leaderboard | Ranked table with profit, bets, win % |
| `/statistik` | Statistics | Financial summary: invested, won, lost, net, ROI per player |
| `/historik` | History | Filter by week/player, expandable week panels with game details |
| `/admin` | Admin | Week management, cascade selector, manual operations |

## Reusable Components

| Component | Used On | Description |
|-----------|---------|-------------|
| `GameCard` | Dashboard, History, Results | Match display: teams, bet type, line, score, result |
| `BetPicker` | GameSelection | Prediction input: 1/X/2 buttons, O/U toggle, score inputs, AH/H3W |
| `WeekHeader` | Dashboard, GameSelection, Results, History | Week number, selector name, dates |
| `StatsCard` | Dashboard, Statistics | Number + label card |
| `TeamAutocomplete` | GameSelection | Search among 138 teams |
| `ProtectedRoute` | All except Login | Auth guard |
| `AdminRoute` | Admin | Auth + is_admin guard |

## Custom Hooks

| Hook | Description |
|------|-------------|
| `useAuth()` | Auth state, signIn, signOut, current user, isAdmin |
| `useGameWeek(weekNumber?)` | Fetch game week, defaults to current |
| `useGames(weekId)` | Games for a week |
| `useBets(weekId, userId?)` | Bets, optionally filtered by user |
| `useLeaderboard()` | Ranked user stats |
| `useStats()` | Financial summary data |
| `useTeams()` | Team list for autocomplete |

All hooks wrap TanStack Query. Mutations invalidate relevant query caches.

## Business Rules (preserved from current app)

1. **Weekly stake:** 200kr per week, split evenly across games (200/1, 200/2, or 200/3)
2. **Games per week:** 1-3, selected by week's selector
3. **Rotation:** Fixed 4-player cycle based on `rotation_order` (0 -> 1 -> 2 -> 3 -> repeat)
4. **One bet per user per game**, prediction must match game's bet category
5. **Bets can be updated** (resets scoring)
6. **Scoring is automatic** when results are entered via Edge Function
7. **Financial tracking** is per-week (`net_profit` entered manually by selector), not per-bet
8. **Season start:** November 24, 2025 (Week 1)
9. **Admin can:** create weeks manually, cancel weeks, create catchup weeks, cascade selector changes, enter results for any week

## Testing

- **Vitest** for unit tests
- Priority: `scoring.ts` and `rotation.ts` (pure logic, many edge cases)
- Quarter-handicap logic needs thorough coverage (split half-bets, push scenarios)

## Not Included (by design)

- Realtime updates (TanStack Query refetch-on-focus is sufficient)
- Invite flow / open registration (4 seeded users)
- Configurable stake amount (fixed 200kr)
- Data migration from current SQL Server (fresh start, or manual seed if needed)
