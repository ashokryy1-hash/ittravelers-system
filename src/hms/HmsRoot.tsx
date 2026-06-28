import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import HmsAuth from './components/HmsAuth'

export default function HmsRoot() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-terracotta-900 flex items-center justify-center">
        <div className="text-white text-sm">Loading…</div>
      </div>
    )
  }

  if (!session) return <HmsAuth />

  return <Outlet />
}
