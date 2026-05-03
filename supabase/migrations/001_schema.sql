-- =============================================
-- 001_schema.sql
-- Chạy file này TRƯỚC trong Supabase SQL Editor
-- =============================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- ENUMS
create type release_type as enum ('music', 'video', 'digital_art');
create type release_status as enum ('draft', 'published', 'archived');
create type market_status as enum ('open', 'closed', 'resolved', 'cancelled');
create type transaction_type as enum (
  'earn_checkin', 'earn_minigame', 'earn_tip_received',
  'spend_prediction', 'spend_tip_sent',
  'refund_prediction', 'reward_prediction',
  'admin_grant'
);
create type game_type as enum (
  'spin_wheel', 'daily_quiz', 'lucky_draw',
  'rhythm_tap', 'guess_the_track', 'coin_flip'
);

-- TABLE: profiles
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique not null,
  display_name     text,
  avatar_url       text,
  bio              text,
  youtube_channel_id   text,
  soundcloud_username  text,
  is_artist        boolean not null default false,
  is_bettor        boolean not null default true,
  vibe_points      integer not null default 100 check (vibe_points >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- TABLE: releases
create table releases (
  id               uuid primary key default uuid_generate_v4(),
  creator_id       uuid not null references profiles(id) on delete cascade,
  title            text not null,
  type             release_type not null,
  description      text,
  link_youtube     text,
  link_soundcloud  text,
  cover_image_url  text,
  status           release_status not null default 'draft',
  tip_total        integer not null default 0,
  view_count       integer not null default 0,
  released_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- TABLE: markets
create table markets (
  id               uuid primary key default uuid_generate_v4(),
  release_id       uuid references releases(id) on delete cascade,
  creator_id       uuid not null references profiles(id),
  question         text not null,
  description      text,
  status           market_status not null default 'open',
  closes_at        timestamptz not null,
  resolved_at      timestamptz,
  resolution       text,
  total_pool       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- TABLE: market_options
create table market_options (
  id                  uuid primary key default uuid_generate_v4(),
  market_id           uuid not null references markets(id) on delete cascade,
  label               text not null,
  total_points_bet    integer not null default 0,
  is_winner           boolean,
  created_at          timestamptz not null default now()
);

-- TABLE: predictions
create table predictions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  market_id        uuid not null references markets(id) on delete cascade,
  option_id        uuid not null references market_options(id),
  points_wagered   integer not null check (points_wagered > 0),
  points_returned  integer,
  created_at       timestamptz not null default now(),
  unique(user_id, market_id)
);

-- TABLE: tips
create table tips (
  id               uuid primary key default uuid_generate_v4(),
  sender_id        uuid not null references profiles(id) on delete cascade,
  release_id       uuid not null references releases(id) on delete cascade,
  points           integer not null check (points > 0),
  message          text,
  created_at       timestamptz not null default now()
);

-- TABLE: mini_game_sessions
create table mini_game_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  game_type        game_type not null,
  points_earned    integer not null default 0,
  result_data      jsonb,
  played_at        timestamptz not null default now()
);

-- TABLE: daily_checkins
create table daily_checkins (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  checkin_date     date not null default current_date,
  streak_day       integer not null default 1,
  points_earned    integer not null default 0,
  created_at       timestamptz not null default now(),
  unique(user_id, checkin_date)
);

-- TABLE: point_transactions
create table point_transactions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  type             transaction_type not null,
  amount           integer not null,
  reference_id     text,
  note             text,
  created_at       timestamptz not null default now()
);

-- TABLE: follows
create table follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- INDEXES
create index on releases(creator_id);
create index on releases(status, released_at desc);
create index on markets(release_id);
create index on markets(status, closes_at);
create index on predictions(user_id);
create index on predictions(market_id);
create index on tips(release_id);
create index on mini_game_sessions(user_id, played_at desc);
create index on daily_checkins(user_id, checkin_date desc);
create index on point_transactions(user_id, created_at desc);

-- TRIGGER: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', 'New Vibe'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- TRIGGER: update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles for each row execute procedure touch_updated_at();
create trigger trg_releases_updated_at
  before update on releases for each row execute procedure touch_updated_at();
create trigger trg_markets_updated_at
  before update on markets for each row execute procedure touch_updated_at();

-- TRIGGER: update tip_total
create or replace function update_release_tip_total()
returns trigger language plpgsql as $$
begin
  update releases set tip_total = tip_total + new.points where id = new.release_id;
  return new;
end;
$$;

create trigger trg_tip_inserted
  after insert on tips for each row execute procedure update_release_tip_total();

-- ROW LEVEL SECURITY
alter table profiles            enable row level security;
alter table releases            enable row level security;
alter table markets             enable row level security;
alter table market_options      enable row level security;
alter table predictions         enable row level security;
alter table tips                enable row level security;
alter table mini_game_sessions  enable row level security;
alter table daily_checkins      enable row level security;
alter table point_transactions  enable row level security;
alter table follows             enable row level security;

-- RLS: profiles
create policy "Public profiles viewable" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- RLS: releases
create policy "Published releases viewable" on releases for select
  using (status = 'published' or creator_id = auth.uid());
create policy "Artists insert releases" on releases for insert
  with check (auth.uid() = creator_id);
create policy "Artists update own releases" on releases for update
  using (creator_id = auth.uid());

-- RLS: markets
create policy "Open markets viewable" on markets for select
  using (status in ('open', 'resolved', 'closed'));
create policy "Auth users create markets" on markets for insert
  with check (auth.uid() = creator_id and auth.uid() is not null);

-- RLS: market_options
create policy "Market options viewable" on market_options for select using (true);
create policy "Market options insert" on market_options for insert
  with check (auth.uid() is not null);

-- RLS: predictions
create policy "Users view own predictions" on predictions for select
  using (auth.uid() = user_id);
create policy "Auth users place predictions" on predictions for insert
  with check (auth.uid() = user_id);

-- RLS: tips
create policy "Tips viewable" on tips for select using (true);
create policy "Auth users send tips" on tips for insert
  with check (auth.uid() = sender_id);

-- RLS: mini_game_sessions
create policy "Users view own sessions" on mini_game_sessions for select
  using (auth.uid() = user_id);
create policy "Users insert own sessions" on mini_game_sessions for insert
  with check (auth.uid() = user_id);

-- RLS: daily_checkins
create policy "Users view own checkins" on daily_checkins for select
  using (auth.uid() = user_id);
create policy "Users insert own checkins" on daily_checkins for insert
  with check (auth.uid() = user_id);

-- RLS: point_transactions
create policy "Users view own transactions" on point_transactions for select
  using (auth.uid() = user_id);
create policy "Service role insert transactions" on point_transactions for insert
  with check (true);

-- RLS: follows
create policy "Follows viewable" on follows for select using (true);
create policy "Users manage follows" on follows for all using (auth.uid() = follower_id);
