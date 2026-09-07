-- CORREÇÃO DA REUNIÃO DE MEIO DE SEMANA
-- Execute UMA VEZ no Supabase > SQL Editor > New query > Run.
-- Corrige o erro 400 do upsert on_conflict=week_start e garante as colunas/políticas.

create table if not exists public.meeting_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
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

alter table public.meeting_weeks add column if not exists week_end date;
alter table public.meeting_weeks add column if not exists source_url text;
alter table public.meeting_weeks add column if not exists source_title text;
alter table public.meeting_weeks add column if not exists bible_text text;
alter table public.meeting_weeks add column if not exists parts jsonb not null default '[]'::jsonb;
alter table public.meeting_weeks add column if not exists songs jsonb not null default '{}'::jsonb;
alter table public.meeting_weeks add column if not exists assignments jsonb not null default '{}'::jsonb;
alter table public.meeting_weeks add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.meeting_weeks add column if not exists imported_at timestamptz not null default now();
alter table public.meeting_weeks add column if not exists updated_at timestamptz not null default now();

-- Remove eventual duplicidade da mesma semana, preservando o registro mais recente.
with ranked as (
  select id, row_number() over (partition by week_start order by updated_at desc nulls last, imported_at desc nulls last, id) as rn
  from public.meeting_weeks
)
delete from public.meeting_weeks m
using ranked r
where m.id = r.id and r.rn > 1;

-- O upsert do aplicativo depende de week_start ser único.
create unique index if not exists meeting_weeks_week_start_unique_idx
  on public.meeting_weeks (week_start);

alter table public.meeting_weeks enable row level security;

drop policy if exists "meeting_weeks_public_read" on public.meeting_weeks;
create policy "meeting_weeks_public_read"
on public.meeting_weeks for select
to anon, authenticated
using (true);

drop policy if exists "meeting_weeks_admin_insert" on public.meeting_weeks;
create policy "meeting_weeks_admin_insert"
on public.meeting_weeks for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "meeting_weeks_admin_update" on public.meeting_weeks;
create policy "meeting_weeks_admin_update"
on public.meeting_weeks for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "meeting_weeks_admin_delete" on public.meeting_weeks;
create policy "meeting_weeks_admin_delete"
on public.meeting_weeks for delete
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

notify pgrst, 'reload schema';
