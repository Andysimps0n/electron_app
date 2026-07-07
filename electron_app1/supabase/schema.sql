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
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text,
  created_at timestamptz default now()
);
alter table public.calendar_events enable row level security;


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

