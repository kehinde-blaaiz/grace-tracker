-- Run this entire file in your Supabase SQL editor (Database > SQL Editor > New Query)
-- It creates all the tables Grace & Growth needs

-- ─────────────────────────────────────────
-- 1. Profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  avatar_color text not null default '#6b8c6e',
  prayer_morning boolean not null default true,
  prayer_afternoon boolean not null default false,
  prayer_night boolean not null default true,
  offering_amount integer not null default 0,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. Reading progress
-- ─────────────────────────────────────────
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  day_index integer not null,       -- 0=Mon … 4=Fri
  done boolean not null default false,
  marked_at timestamptz default now(),
  unique(user_id, week_num, day_index)
);

-- ─────────────────────────────────────────
-- 3. Verse notes (one per day)
-- ─────────────────────────────────────────
create table if not exists public.verse_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  day_index integer not null,
  verse_text text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, week_num, day_index)
);

-- ─────────────────────────────────────────
-- 4. Weekly memorisation verse
-- ─────────────────────────────────────────
create table if not exists public.weekly_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  verse_text text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, week_num)
);

-- ─────────────────────────────────────────
-- 5. Sunday school progress
-- ─────────────────────────────────────────
create table if not exists public.ss_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  lesson_read boolean not null default false,
  lesson_reviewed boolean not null default false,
  updated_at timestamptz default now(),
  unique(user_id, week_num)
);

-- ─────────────────────────────────────────
-- 6. Prayer log (one row per user per date)
-- ─────────────────────────────────────────
create table if not exists public.prayer_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  log_date date not null,
  morning boolean not null default false,
  afternoon boolean not null default false,
  night boolean not null default false,
  updated_at timestamptz default now(),
  unique(user_id, log_date)
);

-- ─────────────────────────────────────────
-- 7. Offering log
-- ─────────────────────────────────────────
create table if not exists public.offering_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  log_date date not null,
  amount integer not null default 0,
  given boolean not null default false,
  updated_at timestamptz default now(),
  unique(user_id, log_date)
);

-- ─────────────────────────────────────────
-- 8. Streak tracking
-- ─────────────────────────────────────────
create table if not exists public.streaks (
  user_id uuid references public.profiles on delete cascade primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- Row Level Security — users see their own
-- data; partners can read each other's
-- ─────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.reading_progress enable row level security;
alter table public.verse_notes enable row level security;
alter table public.weekly_verses enable row level security;
alter table public.ss_progress enable row level security;
alter table public.prayer_log enable row level security;
alter table public.offering_log enable row level security;
alter table public.streaks enable row level security;

-- Profiles: any logged-in user can read all profiles (needed for friend view)
create policy "profiles_read_all" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- All other tables: logged-in users can read ALL rows (friend visibility)
-- but can only insert/update their own
create policy "read_all_authenticated" on public.reading_progress
  for select using (auth.role() = 'authenticated');
create policy "write_own_reading" on public.reading_progress
  for all using (auth.uid() = user_id);

create policy "read_all_verses" on public.verse_notes
  for select using (auth.role() = 'authenticated');
create policy "write_own_verses" on public.verse_notes
  for all using (auth.uid() = user_id);

create policy "read_all_weekly" on public.weekly_verses
  for select using (auth.role() = 'authenticated');
create policy "write_own_weekly" on public.weekly_verses
  for all using (auth.uid() = user_id);

create policy "read_all_ss" on public.ss_progress
  for select using (auth.role() = 'authenticated');
create policy "write_own_ss" on public.ss_progress
  for all using (auth.uid() = user_id);

create policy "read_all_prayer" on public.prayer_log
  for select using (auth.role() = 'authenticated');
create policy "write_own_prayer" on public.prayer_log
  for all using (auth.uid() = user_id);

create policy "read_all_offering" on public.offering_log
  for select using (auth.role() = 'authenticated');
create policy "write_own_offering" on public.offering_log
  for all using (auth.uid() = user_id);

create policy "read_all_streaks" on public.streaks
  for select using (auth.role() = 'authenticated');
create policy "write_own_streaks" on public.streaks
  for all using (auth.uid() = user_id);
