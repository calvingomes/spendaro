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

create table if not exists public.peers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists peers_user_id_name_key on public.peers (user_id, lower(name));

alter table public.peers enable row level security;

create policy "Users can read own peers"
  on public.peers for select
  using (auth.uid() = user_id);

create policy "Users can insert own peers"
  on public.peers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own peers"
  on public.peers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own peers"
  on public.peers for delete
  using (auth.uid() = user_id);

create table if not exists public.splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_expense_id uuid not null references public.expenses (id) on delete restrict,
  peer_ledger_expense_id uuid not null references public.expenses (id) on delete restrict,
  label text not null,
  category text not null,
  my_share numeric(12, 2) not null check (my_share >= 0),
  peer_total numeric(12, 2) not null check (peer_total >= 0),
  split_method text not null check (split_method in ('equal', 'percentage', 'specific')),
  note text,
  status text not null default 'open' check (status in ('open', 'voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.splits enable row level security;

create policy "Users can read own splits"
  on public.splits for select
  using (auth.uid() = user_id);

create policy "Users can insert own splits"
  on public.splits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own splits"
  on public.splits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.split_peers (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null references public.splits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  peer_id uuid not null references public.peers (id) on delete restrict,
  amount_owed numeric(12, 2) not null check (amount_owed >= 0),
  amount_repaid numeric(12, 2) not null default 0 check (amount_repaid >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.split_peers enable row level security;

create policy "Users can read own split_peers"
  on public.split_peers for select
  using (auth.uid() = user_id);

create policy "Users can insert own split_peers"
  on public.split_peers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own split_peers"
  on public.split_peers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

