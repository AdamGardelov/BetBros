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

-- Read policies
create policy "Authenticated users can read users" on users for select to authenticated using (true);
create policy "Authenticated users can read game_weeks" on game_weeks for select to authenticated using (true);
create policy "Authenticated users can read games" on games for select to authenticated using (true);
create policy "Authenticated users can read bets" on bets for select to authenticated using (true);
create policy "Authenticated users can read teams" on teams for select to authenticated using (true);

-- Write policies
create policy "Users can insert own bets" on bets for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own bets" on bets for update to authenticated using (user_id = auth.uid());

create policy "Selector can insert games" on games for insert to authenticated
  with check (exists (select 1 from game_weeks where game_weeks.id = game_week_id and game_weeks.game_selector_id = auth.uid()));

create policy "Selector can update games" on games for update to authenticated
  using (exists (select 1 from game_weeks where game_weeks.id = game_week_id and game_weeks.game_selector_id = auth.uid()));

create policy "Selector can delete games" on games for delete to authenticated
  using (exists (select 1 from game_weeks where game_weeks.id = game_week_id and game_weeks.game_selector_id = auth.uid()));

create policy "Selector can update own week" on game_weeks for update to authenticated
  using (game_selector_id = auth.uid());
