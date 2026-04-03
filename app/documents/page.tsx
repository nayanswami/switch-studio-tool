'use client'

import { useState, useEffect } from 'react'
import { FileText, FilePen, Search, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase'
import { useAuthState } from '../../lib/authGuard'
import { guestStore } from '../../lib/guestStore'

interface Doc {
  id: string; type: string; client_name: string; client_email: string
  total_amount: number; status: string; invoice_number: string; template: string; created_at: string
}

const STATUS_OPTIONS = ['draft', 'sent', 'signed']

export default function Documents() {
  const { user, isGuest, loading: authLoading } = useAuthState()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'agreement'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (authLoading) return
    const load = async () => {
      if (isGuest) {
        // Guest: read strictly from localStorage — only their session's docs
        setDocs(guestStore.getDocs() as Doc[])
      } else {
        // Signed in: strictly filtered to this user's profile_id
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('user_id', user!.id).single()
        if (profile) {
          const { data } = await supabase
            .from('documents').select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: false })
          setDocs(data || [])
        }
      }
      setLoading(false)
    }
    load()
  }, [isGuest, user, authLoading])

  const updateStatus = async (id: string, status: string) => {
    if (isGuest) {
      guestStore.updateDocStatus(id, status)
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    } else {
      await supabase.from('documents').update({ status }).eq('id', id)
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    }
  }

  const filtered = docs.filter(d => {
    const matchSearch = d.client_name?.toLowerCase().includes(search.toLowerCase()) || d.invoice_number?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || d.type === typeFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const statusCls = (s: string) => s === 'signed' ? 'badge-signed' : s === 'sent' ? 'badge-sent' : 'badge-draft'

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-12 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-silver tracking-tight">Documents</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {docs.length} document{docs.length !== 1 ? 's' : ''} {isGuest ? '(local session)' : 'in your account'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/documents/new?type=invoice" className="glow-button flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium">
              <FileText className="w-4 h-4" strokeWidth={1.5} /><span>Invoice</span>
            </Link>
            <Link href="/documents/new?type=agreement" className="glow-button-primary flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium">
              <FilePen className="w-4 h-4" strokeWidth={1.5} /><span>Agreement</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <input type="text" className="premium-input block w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
              placeholder="Search by client or reference…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 glass-card rounded-xl p-1">
            {(['all', 'invoice', 'agreement'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${typeFilter === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 glass-card rounded-xl p-1">
            {(['all', ...STATUS_OPTIONS]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-1">Type</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-2">Template</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-zinc-600 text-sm">No documents found.</p>
              <Link href="/documents/new?type=invoice" className="text-purple-400 text-sm mt-2 inline-block hover:underline">Create your first →</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/3">
              {filtered.map(doc => (
                <div key={doc.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/2 transition-colors group">
                  <div className="col-span-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${doc.type === 'invoice' ? 'bg-purple-500/15 border border-purple-500/20' : 'bg-emerald-500/15 border border-emerald-500/20'}`}>
                      {doc.type === 'invoice' ? <FileText className="w-3.5 h-3.5 text-purple-400" strokeWidth={1.5} /> : <FilePen className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-zinc-200 truncate">{doc.client_name}</p>
                    <p className="text-xs text-zinc-600 truncate">{doc.client_email}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-zinc-500 font-mono">{doc.invoice_number || doc.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-zinc-500 capitalize">{doc.template?.replace('_', ' ') || '—'}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-zinc-300">₹{(doc.total_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="relative inline-block">
                      <select value={doc.status} onChange={e => updateStatus(doc.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium capitalize cursor-pointer appearance-none pr-5 ${statusCls(doc.status)}`}
                        style={{ background: 'transparent' }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
