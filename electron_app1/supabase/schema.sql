-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor).
-- Creates the table that stores one music mix preset per user.


-- DB for music mix presets
create table public.music_mix_presets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preset jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.music_mix_presets enable row level security;

create policy "Users read own preset"
  on public.music_mix_presets for select
  using (auth.uid() = user_id);

create policy "Users insert own preset"
  on public.music_mix_presets for insert
  with check (auth.uid() = user_id);

create policy "Users update own preset"
  on public.music_mix_presets for update
  using (auth.uid() = user_id);









-- DB for calendar events
-- The app stores the same shape used by WeekView: a date key plus minutes
-- inside that day. This keeps localStorage and Supabase easy to merge.
create table if not exists public.calendar_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  title text not null default 'New event',
  details text not null default '',
  day_index int not null default 0,
  start_minute int not null,
  end_minute int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_events
  add column if not exists date_key text not null default '',
  add column if not exists details text not null default '',
  add column if not exists day_index int not null default 0,
  add column if not exists start_minute int not null default 0,
  add column if not exists end_minute int not null default 30,
  add column if not exists updated_at timestamptz not null default now();

-- Older local drafts of this table used starts_at/ends_at. If those columns
-- already exist, keep them harmless so the current app can insert minute-based
-- events without providing timestamp values.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'calendar_events'
      and column_name = 'starts_at'
  ) then
    alter table public.calendar_events alter column starts_at drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'calendar_events'
      and column_name = 'ends_at'
  ) then
    alter table public.calendar_events alter column ends_at drop not null;
  end if;
end $$;

alter table public.calendar_events enable row level security;

drop policy if exists "Users read own events" on public.calendar_events;
drop policy if exists "Users insert own events" on public.calendar_events;
drop policy if exists "Users update own events" on public.calendar_events;
drop policy if exists "Users delete own events" on public.calendar_events;

create policy "Users read own events"
  on public.calendar_events
  for select
  using (auth.uid() = user_id);

create policy "Users insert own events"
  on public.calendar_events
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own events"
  on public.calendar_events
  for update
  using (auth.uid() = user_id);

create policy "Users delete own events"
  on public.calendar_events
  for delete
  using (auth.uid() = user_id);

