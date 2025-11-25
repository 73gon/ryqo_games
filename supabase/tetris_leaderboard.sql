-- Run this in Supabase SQL editor or psql to provision the public weekly leaderboard.
-- It creates a simple table, opens read/insert access, and schedules a Monday reset.

-- Optional: enable pg_cron in your project (Supabase > Database > Extensions) before running.

create table if not exists public.tetris_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists tetris_scores_score_idx
  on public.tetris_scores (score desc, created_at asc);
create index if not exists tetris_scores_created_at_idx
  on public.tetris_scores (created_at);

alter table public.tetris_scores enable row level security;

-- Postgres doesn't support "if not exists" for policies; drop first for idempotency.
drop policy if exists "Allow public inserts" on public.tetris_scores;
drop policy if exists "Allow public reads" on public.tetris_scores;

create policy "Allow public inserts"
  on public.tetris_scores for insert
  with check (true);

create policy "Allow public reads"
  on public.tetris_scores for select
  using (true);

-- Weekly wipe (00:00 UTC every Monday). Requires pg_cron extension enabled.
select
  cron.schedule(
    'tetris_scores_weekly_reset',
    '0 0 * * 1',
    $$ delete from public.tetris_scores where created_at < date_trunc('week', now()); $$
  );
