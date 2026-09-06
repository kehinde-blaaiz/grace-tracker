-- Run ALL of this in Supabase SQL Editor (Database > SQL Editor > New Query)
-- This sets up every table Grace & Growth needs

-- Profiles (auto-created on signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  avatar_color text not null default '#2D5016',
  prayer_morning boolean not null default true,
  prayer_afternoon boolean not null default false,
  prayer_night boolean not null default true,
  offering_amount integer not null default 0,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

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

-- Reading progress (1 chapter per day)
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  day_index integer not null,
  done boolean not null default false,
  marked_at timestamptz default now(),
  unique(user_id, week_num, day_index)
);

-- Verse notes
create table if not exists public.verse_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  day_index integer not null,
  verse_text text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, week_num, day_index)
);

-- Weekly memorisation verse
create table if not exists public.weekly_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  verse_text text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, week_num)
);

-- Sunday school progress
create table if not exists public.ss_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  week_num integer not null,
  lesson_read boolean not null default false,
  lesson_reviewed boolean not null default false,
  updated_at timestamptz default now(),
  unique(user_id, week_num)
);

-- Prayer log
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

-- Offering log
create table if not exists public.offering_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  log_date date not null,
  amount integer not null default 0,
  given boolean not null default false,
  updated_at timestamptz default now(),
  unique(user_id, log_date)
);

-- Streaks
create table if not exists public.streaks (
  user_id uuid references public.profiles on delete cascade primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz default now()
);

-- Partner nudges
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles on delete cascade not null,
  to_user_id uuid references public.profiles on delete cascade not null,
  message text not null default '',
  sent_at timestamptz not null default now(),
  read boolean not null default false
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.reading_progress enable row level security;
alter table public.verse_notes enable row level security;
alter table public.weekly_verses enable row level security;
alter table public.ss_progress enable row level security;
alter table public.prayer_log enable row level security;
alter table public.offering_log enable row level security;
alter table public.streaks enable row level security;
alter table public.nudges enable row level security;

-- Profiles: all authenticated users can read (needed for partner view)
create policy "profiles_read_all" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- All progress tables: read all, write own
do $$ declare t text; begin
  foreach t in array array['reading_progress','verse_notes','weekly_verses','ss_progress','prayer_log','offering_log','streaks'] loop
    execute format('create policy "read_all_%s" on public.%s for select using (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "write_own_%s" on public.%s for all using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- Nudges
create policy "insert_nudge" on public.nudges for insert with check (auth.uid() = from_user_id);
create policy "read_own_nudges" on public.nudges for select using (auth.uid() = to_user_id or auth.uid() = from_user_id);
create policy "update_own_nudges" on public.nudges for update using (auth.uid() = to_user_id);
