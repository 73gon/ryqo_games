create table public.uno_rooms (
  id text primary key,
  host_id text not null,
  status text not null default 'waiting', -- 'waiting', 'playing', 'finished'
  players jsonb not null default '[]'::jsonb,
  game_state jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.uno_rooms enable row level security;

create policy "Anyone can read rooms"
  on public.uno_rooms for select
  using (true);

create policy "Anyone can insert rooms"
  on public.uno_rooms for insert
  with check (true);

create policy "Anyone can update rooms"
  on public.uno_rooms for update
  using (true);
