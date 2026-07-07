-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor).
-- Creates the table that stores one music mix preset per user.

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
