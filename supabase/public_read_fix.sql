-- Correção de leitura pública (401) para as telas públicas do projeto.
-- Pode ser executado mais de uma vez no Supabase SQL Editor.

alter table if exists public.territories enable row level security;
alter table if exists public.field_groups enable row level security;
alter table if exists public.members enable row level security;
alter table if exists public.field_locations enable row level security;
alter table if exists public.field_schedules enable row level security;
alter table if exists public.territory_work_history enable row level security;
alter table if exists public.territory_stops enable row level security;
alter table if exists public.territory_roads enable row level security;

do $$
begin
  if to_regclass('public.territories') is not null then
    drop policy if exists "public_read_territories" on public.territories;
    create policy "public_read_territories" on public.territories for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.field_groups') is not null then
    drop policy if exists "public_read_field_groups" on public.field_groups;
    create policy "public_read_field_groups" on public.field_groups for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.members') is not null then
    drop policy if exists "public_read_members" on public.members;
    create policy "public_read_members" on public.members for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.field_locations') is not null then
    drop policy if exists "public_read_field_locations" on public.field_locations;
    create policy "public_read_field_locations" on public.field_locations for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.field_schedules') is not null then
    drop policy if exists "public_read_field_schedules" on public.field_schedules;
    create policy "public_read_field_schedules" on public.field_schedules for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.territory_work_history') is not null then
    drop policy if exists "public_read_territory_work_history" on public.territory_work_history;
    create policy "public_read_territory_work_history" on public.territory_work_history for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.territory_stops') is not null then
    drop policy if exists "public_read_territory_stops" on public.territory_stops;
    create policy "public_read_territory_stops" on public.territory_stops for select to anon, authenticated using (true);
  end if;
  if to_regclass('public.territory_roads') is not null then
    drop policy if exists "public_read_territory_roads" on public.territory_roads;
    create policy "public_read_territory_roads" on public.territory_roads for select to anon, authenticated using (true);
  end if;
end $$;
