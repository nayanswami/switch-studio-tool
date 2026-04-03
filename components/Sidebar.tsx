'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Users, Settings, Zap, FilePen } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="no-print w-56 flex-shrink-0 flex flex-col h-screen bg-black border-r border-white/5 relative z-20">
      {/* Logo */}
      <div className="flex items-center space-x-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <span className="font-bold text-sm text-white tracking-tight">Switch Studio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'nav-active'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <Link
            href="/documents/new?type=invoice"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all group"
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.75} />
            <span>New Invoice</span>
          </Link>
          <Link
            href="/documents/new?type=agreement"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all group"
          >
            <FilePen className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.75} />
            <span>New Agreement</span>
          </Link>
        </div>
      </nav>

      {/* Footer / Profile link */}
      <div className="p-3 border-t border-white/5">
        <Link
          href="/onboarding"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-400 text-[10px] font-bold">SS</span>
          </div>
          <span>Brand Profile</span>
        </Link>
      </div>
    </aside>
  )
}
