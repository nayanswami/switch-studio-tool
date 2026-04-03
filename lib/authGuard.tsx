'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// AuthGuard for Guest-First architecture:
// - Always renders children (no redirect, no login wall)
// - Provides auth state via context (isGuest = !user)
// - Real sign-in happens only when the user explicitly clicks "Save to Cloud"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(() => setReady(true))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => setReady(true))
    return () => subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

// ─── useAuthState hook ────────────────────────────────────────────────────────
// Use this anywhere you need to branch between guest and signed-in user logic.

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, isGuest: !user, loading }
}
