import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAllData } from '../services/data'

export function useData() {
  const [data, setData] = useState({ territories: [], groups: [], members: [], locations: [], schedules: [], history: [], stops: [], roads: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    try { setLoading(true); setError(''); setData(await fetchAllData()) } catch (e) { setError(e.message || 'Não foi possível carregar os dados.') } finally { setLoading(false) }
  }, [])

  useEffect(() => { reload() }, [reload])
  useEffect(() => {
    if (!supabase) return
    const channel = supabase.channel('territorio-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territories' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'field_groups' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'field_locations' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'field_schedules' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territory_work_history' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territory_stops' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territory_roads' }, reload)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [reload])
  return { ...data, loading, error, reload }
}
