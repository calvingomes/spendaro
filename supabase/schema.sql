create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0 OR type = 'savings'),
  type text not null default 'debit' check (type in ('credit', 'debit', 'savings')),
  pot_id uuid references public.pots (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can read own expenses"
  on public.expenses
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses
  for delete
  using (auth.uid() = user_id);

create table if not exists public.pots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  goal numeric(12, 2) not null default 0 check (goal >= 0),
  color text not null default '#f5a623',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pots enable row level security;

create policy "Users can read own pots"
  on public.pots for select
  using (auth.uid() = user_id);

create policy "Users can insert own pots"
  on public.pots for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pots"
  on public.pots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own pots"
  on public.pots for delete
  using (auth.uid() = user_id);
