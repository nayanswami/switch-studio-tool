'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { migrateGuestData } from '../../lib/migration'
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

// This page is now optional — the / route is public.
// Users reach here via "Save to Cloud" or direct navigation.
export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let user = null

    if (mode === 'login') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      user = data.user
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      user = data.user
    }

    setLoading(false)

    // Migrate any local guest data to the cloud
    if (user) {
      setMigrating(true)
      await migrateGuestData(user)
      setMigrating(false)
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-500 to-purple-800 flex items-center justify-center mb-4 shadow-lg shadow-purple-900/40">
            <Zap className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Tool</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to sync your data to the cloud</p>
        </div>

        {migrating ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
            <p className="text-sm font-medium text-white">Migrating your data…</p>
            <p className="text-xs text-zinc-500">Moving your invoices and settings to the cloud</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              <button type="button" onClick={() => { setMode('login'); setError(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Log In
              </button>
              <button type="button" onClick={() => { setMode('signup'); setError(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="premium-input block w-full rounded-xl py-2.5 pl-10 pr-4 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                  <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters" className="premium-input block w-full rounded-xl py-2.5 pl-10 pr-10 text-sm" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="glow-button-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Logging in…' : 'Creating account…'}</> : (mode === 'login' ? 'Log In & Sync' : 'Create Account & Sync')}
              </button>
            </form>

            <p className="text-[11px] text-zinc-700 text-center">
              Or just{' '}
              <a href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors underline">go back to the dashboard</a>
              {' '}without an account.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
