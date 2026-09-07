-- Reunião Meio de Semana — migração para o projeto Oeste de Maracanaú
-- Execute no Supabase SQL Editor. É seguro executar mais de uma vez.

create table if not exists public.meeting_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  week_end date not null,
  source_url text,
  source_title text,
  bible_text text,
  parts jsonb not null default '[]'::jsonb,
  songs jsonb not null default '{}'::jsonb,
  assignments jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meeting_weeks enable row level security;

drop policy if exists "meeting_weeks_public_read" on public.meeting_weeks;
create policy "meeting_weeks_public_read"
on public.meeting_weeks
for select
to anon, authenticated
using (true);

drop policy if exists "meeting_weeks_admin_insert" on public.meeting_weeks;
create policy "meeting_weeks_admin_insert"
on public.meeting_weeks
for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "meeting_weeks_admin_update" on public.meeting_weeks;
create policy "meeting_weeks_admin_update"
on public.meeting_weeks
for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "meeting_weeks_admin_delete" on public.meeting_weeks;
create policy "meeting_weeks_admin_delete"
on public.meeting_weeks
for delete
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create index if not exists meeting_weeks_week_start_idx on public.meeting_weeks (week_start desc);
create index if not exists meeting_weeks_updated_at_idx on public.meeting_weeks (updated_at desc);

-- Realtime é opcional; se já estiver habilitado no projeto, o bloco abaixo não é necessário.
-- alter publication supabase_realtime add table public.meeting_weeks;
