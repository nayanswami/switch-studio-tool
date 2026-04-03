'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, FileText, Users, Settings,
  Zap, FilePen, LogOut, X, Menu, CloudUpload,
  Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthState } from '../lib/authGuard'
import { guestStore } from '../lib/guestStore'
import { migrateGuestData } from '../lib/migration'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

// ─── Save to Cloud Modal ───────────────────────────────────────────────────────
function SaveToCloudModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const hasLocalData = guestStore.hasData()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let user = null

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      user = data.user
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      user = data.user
    }

    setLoading(false)

    if (user && hasLocalData) {
      setMigrating(true)
      await migrateGuestData(user)
      setMigrating(false)
    }

    setDone(true)
    setTimeout(() => { onSuccess() }, 1500)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-white">All synced to cloud!</p>
          <p className="text-xs text-zinc-500">Your invoices and settings are saved under <strong className="text-zinc-300">{email}</strong></p>
        </div>
      </div>
    )
  }

  if (migrating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-sm text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
          <p className="text-sm font-medium text-white">Migrating your data…</p>
          <p className="text-xs text-zinc-500">Moving your invoices and settings to the cloud</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-sm space-y-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Save to Cloud</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasLocalData && (
          <div className="flex items-start gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5 text-xs text-purple-300">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400" />
            Your local invoices and settings will be migrated automatically.
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['signup', 'login'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${mode === m ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {m === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          ))}
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
                placeholder="Min. 6 characters" className="premium-input block w-full rounded-xl py-2.5 pl-10 pr-10 text-sm" />
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

          <button type="submit" disabled={loading} className="glow-button-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'signup' ? 'Creating…' : 'Logging in…'}</> : (mode === 'signup' ? 'Create Account & Sync' : 'Log In & Sync')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isGuest } = useAuthState()
  const [profile, setProfile] = useState<{ company_name: string; logo_url: string; logo_data_url?: string } | null>(null)
  const [showSyncModal, setShowSyncModal] = useState(false)

  const loadProfile = useCallback(async () => {
    if (isGuest) {
      const p = guestStore.getProfile()
      if (p.company_name || p.logo_data_url) setProfile({ company_name: p.company_name, logo_url: p.logo_url, logo_data_url: p.logo_data_url })
    } else {
      const { data } = await supabase.from('profiles').select('company_name, logo_url, logo_data_url').limit(1).single()
      if (data) setProfile(data)
    }
  }, [isGuest])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const logoSrc = profile?.logo_data_url || profile?.logo_url

  return (
    <>
      {showSyncModal && (
        <SaveToCloudModal
          onClose={() => setShowSyncModal(false)}
          onSuccess={() => { setShowSyncModal(false); router.refresh() }}
        />
      )}

      <div className="w-full flex flex-col h-full bg-black border-r border-white/5">
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5 overflow-hidden">
          <div className="flex items-center space-x-2.5 min-w-0">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="w-7 h-7 object-contain shrink-0 rounded" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
            )}
            <span className="font-bold text-sm text-white tracking-tight truncate">
              {profile?.company_name || 'Invoice Tool'}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all lg:hidden ml-2">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? 'nav-active' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-white/5">
            <Link href="/documents/new?type=invoice" onClick={onClose}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all group">
              <FileText className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.75} />
              <span>New Invoice</span>
            </Link>
            <Link href="/documents/new?type=agreement" onClick={onClose}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all group">
              <FilePen className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.75} />
              <span>New Agreement</span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 space-y-1.5">
          {isGuest ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] text-amber-500 font-medium">Guest Mode — Not saved</span>
              </div>
              <button
                onClick={() => setShowSyncModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-purple-600/80 to-purple-800/80 hover:from-purple-500/90 hover:to-purple-700/90 border border-purple-500/30 transition-all"
              >
                <CloudUpload className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                Save to Cloud
              </button>
            </>
          ) : (
            <>
              {user?.email && <div className="px-3 py-1.5 text-[11px] text-zinc-600 truncate">{user.email}</div>}
              <button onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all group">
                <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400" strokeWidth={1.75} />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden no-print fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
        aria-label="Open menu">
        <Menu className="w-4 h-4" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`lg:hidden no-print fixed top-0 left-0 z-50 h-full w-64 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      <aside className="no-print w-56 shrink-0 hidden lg:flex flex-col h-screen relative z-20">
        <SidebarContent />
      </aside>
    </>
  )
}
