-- Add reading plan settings to profiles table
alter table public.profiles add column if not exists plan_book text default 'Mark';
alter table public.profiles add column if not exists plan_chapters_per_day integer default 1;

-- Reading plan proposals between partners
create table if not exists public.plan_proposals (
  id uuid primary key default gen_random_uuid(),
  proposed_by uuid references public.profiles on delete cascade not null,
  proposed_to uuid references public.profiles on delete cascade not null,
  book text not null,
  chapters_per_day integer not null default 1,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz default now()
);

alter table public.plan_proposals enable row level security;

create policy "propose_plan" on public.plan_proposals
  for insert with check (auth.uid() = proposed_by);

create policy "read_own_proposals" on public.plan_proposals
  for select using (auth.uid() = proposed_by or auth.uid() = proposed_to);

create policy "update_proposal" on public.plan_proposals
  for update using (auth.uid() = proposed_to);
