-- supabase/migrations/003_oauth_helper.sql
-- Helper function for OAuth profile creation (bypasses typed client issues)

create or replace function create_profile_if_missing(
  p_id          uuid,
  p_username    text,
  p_display_name text,
  p_avatar_url  text default null
) returns void language plpgsql security definer as $$
begin
  insert into profiles (id, username, display_name, avatar_url, vibe_points)
  values (p_id, p_username, p_display_name, p_avatar_url, 100)
  on conflict (id) do nothing;
end;
$$;
