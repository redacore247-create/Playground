-- supabase/migrations/002_vibe_points_functions.sql
-- Atomic Postgres functions for all Vibe Points mutations
-- These run inside transactions — either everything succeeds or nothing does.

-- ============================================================
-- HELPER: deduct points with balance check
-- ============================================================
create or replace function _deduct_points(
  p_user_id uuid,
  p_amount   integer  -- positive integer representing points to remove
) returns integer language plpgsql as $$
declare
  v_current integer;
begin
  select vibe_points into v_current
  from profiles
  where id = p_user_id
  for update;  -- row lock prevents race conditions

  if v_current < p_amount then
    raise exception 'insufficient_points: need % but have %', p_amount, v_current;
  end if;

  update profiles
  set vibe_points = vibe_points - p_amount
  where id = p_user_id;

  return v_current - p_amount;
end;
$$;

-- ============================================================
-- HELPER: credit points
-- ============================================================
create or replace function _credit_points(
  p_user_id uuid,
  p_amount   integer
) returns integer language plpgsql as $$
declare
  v_new integer;
begin
  update profiles
  set vibe_points = vibe_points + p_amount
  where id = p_user_id
  returning vibe_points into v_new;
  return v_new;
end;
$$;

-- ============================================================
-- HELPER: insert transaction record
-- ============================================================
create or replace function _log_transaction(
  p_user_id     uuid,
  p_type        transaction_type,
  p_amount      integer,
  p_reference   text default null,
  p_note        text default null
) returns void language plpgsql as $$
begin
  insert into point_transactions (user_id, type, amount, reference_id, note)
  values (p_user_id, p_type, p_amount, p_reference, p_note);
end;
$$;

-- ============================================================
-- PUBLIC: mutate_vibe_points
-- Generic earn/spend — used for admin grants, simple rewards
-- ============================================================
create or replace function mutate_vibe_points(
  p_user_id    uuid,
  p_amount     integer,   -- positive = earn, negative = spend
  p_type       transaction_type,
  p_reference_id text default null,
  p_note       text default null
) returns integer language plpgsql security definer as $$
declare
  v_new_balance integer;
begin
  if p_amount < 0 then
    v_new_balance := _deduct_points(p_user_id, abs(p_amount));
  else
    v_new_balance := _credit_points(p_user_id, p_amount);
  end if;

  perform _log_transaction(p_user_id, p_type, p_amount, p_reference_id, p_note);
  return v_new_balance;
end;
$$;

-- ============================================================
-- PUBLIC: send_tip
-- Deducts from sender, credits artist, inserts tip row
-- ============================================================
create or replace function send_tip(
  p_sender_id  uuid,
  p_release_id uuid,
  p_creator_id uuid,
  p_points     integer,
  p_message    text default null
) returns integer language plpgsql security definer as $$
declare
  v_tip_id        uuid;
  v_sender_balance integer;
begin
  -- Deduct from sender (raises if insufficient)
  v_sender_balance := _deduct_points(p_sender_id, p_points);
  perform _log_transaction(p_sender_id, 'spend_tip_sent', -p_points, p_release_id::text, 'Tip sent');

  -- Credit artist
  perform _credit_points(p_creator_id, p_points);
  perform _log_transaction(p_creator_id, 'earn_tip_received', p_points, p_release_id::text, 'Tip received');

  -- Insert tip record
  insert into tips (sender_id, release_id, points, message)
  values (p_sender_id, p_release_id, p_points, p_message)
  returning id into v_tip_id;

  return v_sender_balance;
end;
$$;

-- ============================================================
-- PUBLIC: place_prediction
-- Deducts points, inserts prediction, updates market pool
-- ============================================================
create or replace function place_prediction(
  p_user_id   uuid,
  p_market_id uuid,
  p_option_id uuid,
  p_points    integer
) returns integer language plpgsql security definer as $$
declare
  v_market         markets%rowtype;
  v_pred_id        uuid;
  v_new_balance    integer;
begin
  -- Validate market is still open
  select * into v_market from markets where id = p_market_id for update;
  if v_market.status != 'open' then
    raise exception 'market_not_open: market % is %', p_market_id, v_market.status;
  end if;
  if v_market.closes_at < now() then
    raise exception 'market_closed: market has passed its close time';
  end if;

  -- Check user hasn't already bet
  if exists (
    select 1 from predictions
    where user_id = p_user_id and market_id = p_market_id
  ) then
    raise exception 'already_predicted: user has already placed a bet on this market';
  end if;

  -- Deduct points
  v_new_balance := _deduct_points(p_user_id, p_points);
  perform _log_transaction(p_user_id, 'spend_prediction', -p_points, p_market_id::text, 'Prediction placed');

  -- Insert prediction
  insert into predictions (user_id, market_id, option_id, points_wagered)
  values (p_user_id, p_market_id, p_option_id, p_points)
  returning id into v_pred_id;

  -- Update market pool and option totals (triggers also do this, but explicit is safer)
  update markets set total_pool = total_pool + p_points where id = p_market_id;
  update market_options set total_points_bet = total_points_bet + p_points where id = p_option_id;

  return v_new_balance;
end;
$$;

-- ============================================================
-- PUBLIC: resolve_market
-- Called by market creator — distributes winnings proportionally
-- ============================================================
create or replace function resolve_market(
  p_market_id       uuid,
  p_winning_option  uuid,
  p_resolution_note text default null
) returns integer language plpgsql security definer as $$
declare
  v_winner       record;
  v_total_pool   integer;
  v_winning_pool integer;
  v_payout       integer;
  v_winners_count integer := 0;
begin
  -- Lock and validate
  select total_pool into v_total_pool
  from markets where id = p_market_id for update;

  -- Mark winning option
  update market_options set is_winner = true where id = p_winning_option;
  update market_options set is_winner = false
    where market_id = p_market_id and id != p_winning_option;

  -- Get winning pool total
  select coalesce(total_points_bet, 0) into v_winning_pool
  from market_options where id = p_winning_option;

  -- Distribute proportional winnings to each winner
  for v_winner in
    select p.id, p.user_id, p.points_wagered
    from predictions p
    where p.market_id = p_market_id and p.option_id = p_winning_option
  loop
    -- Proportional share of total pool
    v_payout := floor(v_total_pool * v_winner.points_wagered::float / v_winning_pool);

    -- Credit winner
    perform _credit_points(v_winner.user_id, v_payout);
    perform _log_transaction(
      v_winner.user_id, 'reward_prediction', v_payout,
      p_market_id::text, 'Prediction won'
    );

    -- Update prediction record
    update predictions set points_returned = v_payout where id = v_winner.id;
    v_winners_count := v_winners_count + 1;
  end loop;

  -- Mark losers
  update predictions set points_returned = 0
    where market_id = p_market_id
    and option_id != p_winning_option
    and points_returned is null;

  -- Close market
  update markets set
    status = 'resolved',
    resolved_at = now(),
    resolution = p_resolution_note
  where id = p_market_id;

  return v_winners_count;
end;
$$;

-- ============================================================
-- PUBLIC: record_mini_game
-- Rate-limited game result recording
-- ============================================================
create or replace function record_mini_game(
  p_user_id      uuid,
  p_game_type    text,
  p_points_earned integer,
  p_result_data  jsonb default null
) returns integer language plpgsql security definer as $$
declare
  v_plays_today  integer;
  v_max_plays    integer;
  v_new_balance  integer;
  v_session_id   uuid;
  -- Daily play limits per game type
  v_limits       jsonb := '{"spin_wheel":1,"daily_quiz":2,"lucky_draw":1,"rhythm_tap":5,"guess_the_track":3,"coin_flip":5}'::jsonb;
begin
  v_max_plays := coalesce((v_limits->>p_game_type)::integer, 3);

  select count(*) into v_plays_today
  from mini_game_sessions
  where user_id = p_user_id
    and game_type = p_game_type::game_type
    and played_at::date = current_date;

  if v_plays_today >= v_max_plays then
    raise exception 'daily_limit_reached: max % plays per day for %', v_max_plays, p_game_type;
  end if;

  -- Insert session
  insert into mini_game_sessions (user_id, game_type, points_earned, result_data)
  values (p_user_id, p_game_type::game_type, p_points_earned, p_result_data)
  returning id into v_session_id;

  -- Credit points
  v_new_balance := _credit_points(p_user_id, p_points_earned);
  perform _log_transaction(p_user_id, 'earn_minigame', p_points_earned, v_session_id::text, 'Mini game: ' || p_game_type);

  return v_new_balance;
end;
$$;

-- ============================================================
-- PUBLIC: daily_checkin
-- Streak-based daily reward (10 + 5*streak, max 60)
-- ============================================================
create or replace function daily_checkin(
  p_user_id uuid
) returns jsonb language plpgsql security definer as $$
declare
  v_last_checkin   date;
  v_streak         integer := 1;
  v_points         integer;
  v_checkin_id     uuid;
  v_new_balance    integer;
begin
  -- Check already checked in today
  if exists (
    select 1 from daily_checkins
    where user_id = p_user_id and checkin_date = current_date
  ) then
    raise exception 'already_checked_in';
  end if;

  -- Get last checkin to compute streak
  select checkin_date, streak_day into v_last_checkin, v_streak
  from daily_checkins
  where user_id = p_user_id
  order by checkin_date desc
  limit 1;

  if v_last_checkin = current_date - 1 then
    -- Consecutive day — increment streak
    v_streak := v_streak + 1;
  else
    -- Streak broken or first time
    v_streak := 1;
  end if;

  -- Points: 10 base + 5 per streak day, capped at 60
  v_points := least(10 + (v_streak - 1) * 5, 60);

  insert into daily_checkins (user_id, checkin_date, streak_day, points_earned)
  values (p_user_id, current_date, v_streak, v_points)
  returning id into v_checkin_id;

  v_new_balance := _credit_points(p_user_id, v_points);
  perform _log_transaction(p_user_id, 'earn_checkin', v_points, v_checkin_id::text,
    'Day ' || v_streak || ' check-in');

  return jsonb_build_object(
    'points_earned', v_points,
    'streak_day', v_streak,
    'new_balance', v_new_balance
  );
end;
$$;
