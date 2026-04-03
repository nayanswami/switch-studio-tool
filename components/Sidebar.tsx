'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FileText, Users, Settings,
  Zap, FilePen, LogOut, X, Menu
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<{ company_name: string; logo_url: string } | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null)
    })
    supabase.from('profiles').select('company_name, logo_url').limit(1).single().then(({ data }) => {
      if (data) setProfile(data)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-full flex flex-col h-full bg-black border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5 overflow-hidden">
        <div className="flex items-center space-x-2.5 min-w-0">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo" className="w-7 h-7 object-contain shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
          )}
          <span className="font-bold text-sm text-white tracking-tight truncate">
            {profile?.company_name || 'Invoice Tool'}
          </span>
        </div>
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all lg:hidden ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive ? 'nav-active' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <Link
            href="/documents/new?type=invoice"
            onClick={onClose}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all group"
          >
            <FileText className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.75} />
            <span>New Invoice</span>
          </Link>
          <Link
            href="/documents/new?type=agreement"
            onClick={onClose}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all group"
          >
            <FilePen className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.75} />
            <span>New Agreement</span>
          </Link>
        </div>
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {userEmail && (
          <div className="px-3 py-2 text-[11px] text-zinc-600 truncate">{userEmail}</div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400" strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden no-print fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`
        lg:hidden no-print fixed top-0 left-0 z-50 h-full w-64 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="no-print w-56 shrink-0 hidden lg:flex flex-col h-screen relative z-20">
        <SidebarContent />
      </aside>
    </>
  )
}
