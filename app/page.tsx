'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, FilePen, Users, Plus, ChevronRight, Keyboard, X, ArrowRight, Clock, FileStack } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'
import { useAuthState } from '../lib/authGuard'
import { guestStore } from '../lib/guestStore'

interface Doc {
  id: string
  type: string
  client_name: string
  total_amount: number
  status: string
  invoice_number: string
  created_at: string
}

const SHORTCUTS = [
  { key: 'N', label: 'New Invoice', href: '/documents/new?type=invoice' },
  { key: 'A', label: 'New Agreement', href: '/documents/new?type=agreement' },
  { key: 'D', label: 'All Documents', href: '/documents' },
  { key: 'C', label: 'Clients', href: '/clients' },
  { key: 'S', label: 'Settings', href: '/settings' },
  { key: '?', label: 'Show Shortcuts', href: '' },
]

export default function Dashboard() {
  const router = useRouter()
  const { user, isGuest, loading: authLoading } = useAuthState()
  const [docs, setDocs] = useState<Doc[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const load = async () => {
      if (isGuest) {
        // Guest: read from localStorage
        const profile = guestStore.getProfile()
        const localDocs = guestStore.getDocs()
        const localClients = guestStore.getClients()
        setCompanyName(profile.company_name || null)
        setDocs(localDocs.slice(0, 10) as Doc[])
        setClientCount(localClients.length)
      } else {
        // Signed in: read from Supabase, scoped to their profile
        const { data: profile } = await supabase
          .from('profiles').select('id, company_name').eq('user_id', user!.id).single()
        if (profile) {
          setCompanyName(profile.company_name)
          const [{ data: docsData }, { count: cCount }] = await Promise.all([
            supabase.from('documents').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(10),
            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id),
          ])
          if (docsData) setDocs(docsData)
          setClientCount(cCount || 0)
        }
      }
      setLoading(false)
    }
    load()
  }, [isGuest, user, authLoading])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    switch (e.key.toLowerCase()) {
      case 'n': router.push('/documents/new?type=invoice'); break
      case 'a': router.push('/documents/new?type=agreement'); break
      case 'd': router.push('/documents'); break
      case 'c': router.push('/clients'); break
      case 's': router.push('/settings'); break
      case '?': setShowShortcuts(v => !v); break
      case 'escape': setShowShortcuts(false); break
    }
  }, [router])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const invoiceCount = docs.filter(d => d.type === 'invoice').length
  const agreementCount = docs.filter(d => d.type === 'agreement').length
  const draftCount = docs.filter(d => d.status === 'draft').length
  const totalInvoiced = docs.filter(d => d.type === 'invoice').reduce((s, d) => s + (d.total_amount || 0), 0)

  const statusCls = (s: string) =>
    s === 'signed' ? 'badge-signed' : s === 'sent' ? 'badge-sent' : 'badge-draft'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AppLayout>
      {/* Shortcut Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowShortcuts(false)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Keyboard Shortcuts</span>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(sc => (
                <div key={sc.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-zinc-300">{sc.label}</span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-xs font-mono text-zinc-300 font-bold">{sc.key}</kbd>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-4 text-center">Shortcuts work when not typing in a field</p>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-16 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 lg:mb-8">
          <div>
            <p className="text-zinc-500 text-sm">{today}</p>
            <h1 className="text-xl lg:text-2xl font-bold text-white mt-0.5">
              {greeting()}{companyName ? `, ${companyName}` : ''} 👋
            </h1>
          </div>
          <Link href="/documents/new?type=invoice"
            className="glow-button-primary flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono hidden lg:inline">N</kbd>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-5 lg:mb-6">
          <Link href="/documents/new?type=invoice" className="glass-card glass-card-hover rounded-xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 group">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">New Invoice</p>
              <p className="text-xs text-zinc-500 mt-0.5">Bill a client</p>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] font-mono text-zinc-500 hidden sm:inline">N</kbd>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </Link>
          <Link href="/documents/new?type=agreement" className="glass-card glass-card-hover rounded-xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 group">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <FilePen className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">New Agreement</p>
              <p className="text-xs text-zinc-500 mt-0.5">Draft a contract</p>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] font-mono text-zinc-500 hidden sm:inline">A</kbd>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </Link>
          <Link href="/documents" className="glass-card glass-card-hover rounded-xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 group">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
              <FileStack className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">All Documents</p>
              <p className="text-xs text-zinc-500 mt-0.5">Browse & manage</p>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] font-mono text-zinc-500 hidden sm:inline">D</kbd>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-5 lg:mb-6">
          {[
            { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}`, sub: 'all time', color: 'text-white' },
            { label: 'Invoices', value: invoiceCount, sub: `${draftCount} draft${draftCount !== 1 ? 's' : ''}`, color: 'text-white' },
            { label: 'Agreements', value: agreementCount, sub: `${docs.filter(d => d.type === 'agreement' && d.status === 'signed').length} signed`, color: 'text-white' },
            { label: 'Clients', value: clientCount, sub: 'saved profiles', color: 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-xl px-3 py-3 lg:px-4 lg:py-3.5">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              {loading ? <div className="h-6 w-16 bg-white/5 rounded animate-pulse" /> : <p className={`text-base lg:text-lg font-bold ${stat.color}`}>{stat.value}</p>}
              <p className="text-xs text-zinc-600 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Recent Documents */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 lg:px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-white">Recent Documents</span>
            </div>
            <Link href="/documents" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}
            </div>
          ) : docs.length === 0 ? (
            <div className="py-12 lg:py-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/3 border border-white/8 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-zinc-600" strokeWidth={1.5} />
              </div>
              <p className="text-zinc-500 text-sm">No documents yet</p>
              <Link href="/documents/new?type=invoice" className="text-purple-400 text-sm mt-1.5 inline-block hover:underline">
                Create your first invoice →
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest border-b border-white/3">
                <div className="col-span-1">Type</div>
                <div className="col-span-4">Client</div>
                <div className="col-span-3">Ref / ID</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              {docs.map(doc => (
                <div key={doc.id} className="border-b border-white/3 last:border-0 hover:bg-white/2 transition-colors">
                  <div className="hidden md:grid grid-cols-12 items-center px-5 py-3.5">
                    <div className="col-span-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${doc.type === 'invoice' ? 'bg-purple-500/15 border border-purple-500/20' : 'bg-emerald-500/15 border border-emerald-500/20'}`}>
                        {doc.type === 'invoice' ? <FileText className="w-3 h-3 text-purple-400" strokeWidth={1.5} /> : <FilePen className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-zinc-200 font-medium truncate">{doc.client_name}</p>
                      <p className="text-xs text-zinc-600">{new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs text-zinc-500 font-mono">{doc.invoice_number || doc.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-semibold text-zinc-200">₹{(doc.total_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusCls(doc.status)}`}>{doc.status}</span>
                    </div>
                  </div>
                  <div className="md:hidden flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'invoice' ? 'bg-purple-500/15 border border-purple-500/20' : 'bg-emerald-500/15 border border-emerald-500/20'}`}>
                      {doc.type === 'invoice' ? <FileText className="w-3.5 h-3.5 text-purple-400" strokeWidth={1.5} /> : <FilePen className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium truncate">{doc.client_name}</p>
                      <p className="text-xs text-zinc-600">{new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-zinc-200">₹{(doc.total_amount || 0).toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusCls(doc.status)}`}>{doc.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="hidden lg:flex items-center justify-center gap-1 mt-6 flex-wrap">
          <button onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all border border-transparent hover:border-white/8">
            <Keyboard className="w-3 h-3" />
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/8 border border-white/10 font-mono text-zinc-400 font-bold">?</kbd> for all shortcuts
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
