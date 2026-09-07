import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    let cancelled = false
    if (!session || !supabase) { setIsAdmin(false); return }
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => { if (!cancelled) setIsAdmin(data?.role === 'admin') })
    return () => { cancelled = true }
  }, [session])
  const signIn = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase não está configurado.' } }
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) return result
    const userId = result.data?.user?.id
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut()
      return { error: { message: 'Este usuário ainda não é administrador. Execute supabase/admin_setup.sql no Supabase.' } }
    }
    return result
  }
  return { session, isAdmin, signIn, signOut: () => supabase?.auth.signOut() }
}
