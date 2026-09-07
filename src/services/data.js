import { supabase } from '../lib/supabase'

const tables = {
  territories: 'territories', groups: 'field_groups', members: 'members', locations: 'field_locations', schedules: 'field_schedules', history: 'territory_work_history', stops: 'territory_stops', roads: 'territory_roads'
}

export async function fetchAllData() {
  if (!supabase) return { territories: [], groups: [], members: [], locations: [], schedules: [], history: [], stops: [], roads: [] }
  const [territories, groups, members, locations, schedules, history, stops, roads] = await Promise.all([
    supabase.from(tables.territories).select('*').order('name'),
    supabase.from(tables.groups).select('*').order('name'),
    supabase.from(tables.members).select('*').order('name'),
    supabase.from(tables.locations).select('*').order('name'),
    supabase.from(tables.schedules).select('*').order('service_date').order('start_time'),
    supabase.from(tables.history).select('*').order('worked_at', { ascending: false }),
    supabase.from(tables.stops).select('*').order('worked_at', { ascending: false }),
    supabase.from(tables.roads).select('*').order('road_name')
  ])
  const errors = [territories,groups,members,locations,schedules,history,stops,roads].find(x => x.error)
  if (errors?.error) throw errors.error
  return { territories: territories.data || [], groups: groups.data || [], members: members.data || [], locations: locations.data || [], schedules: schedules.data || [], history: history.data || [], stops: stops.data || [], roads: roads.data || [] }
}

export async function insertRow(table, payload) { const { data, error } = await supabase.from(table).insert(payload).select().single(); if (error) throw error; return data }
export async function updateRow(table, id, payload) { const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single(); if (error) throw error; return data }
export async function deleteRow(table, id) { const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error }
