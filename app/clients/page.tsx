'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Search, Phone, Mail, MapPin, Trash2 } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase'
import { useAuthState } from '../../lib/authGuard'
import { guestStore, GuestClient } from '../../lib/guestStore'

interface Client { id: string; name: string; email: string; address: string; phone: string; created_at: string }

export default function Clients() {
  const { user, isGuest, loading: authLoading } = useAuthState()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', address: '', phone: '' })

  useEffect(() => {
    if (authLoading) return
    if (isGuest) {
      setClients(guestStore.getClients())
      setLoading(false)
    } else {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
        if (profile) {
          setProfileId(profile.id)
          const { data } = await supabase.from('clients').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false })
          setClients(data || [])
        }
        setLoading(false)
      })
    }
  }, [isGuest, user, authLoading])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (isGuest) {
      const newClient: GuestClient = { ...form, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      guestStore.addClient(newClient)
      setClients(guestStore.getClients())
    } else {
      if (!profileId) return
      await supabase.from('clients').insert([{ ...form, profile_id: profileId }])
      const { data } = await supabase.from('clients').select('*').eq('profile_id', profileId).order('created_at', { ascending: false })
      setClients(data || [])
    }
    setForm({ name: '', email: '', address: '', phone: '' })
    setShowForm(false)
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (isGuest) {
      guestStore.deleteClient(id)
      setClients(guestStore.getClients())
    } else {
      await supabase.from('clients').delete().eq('id', id)
      setClients(prev => prev.filter(c => c.id !== id))
    }
  }

  const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  const inputCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm'

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-12 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gradient-silver tracking-tight">Clients</h1>
            <p className="text-zinc-500 text-sm mt-1 hidden sm:block">Manage saved client profiles for quick autofill</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="glow-button-primary flex items-center space-x-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl text-sm font-medium">
            <UserPlus className="w-4 h-4" /><span>Add Client</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="glass-card rounded-2xl p-5 lg:p-6 mb-6 space-y-4">
            <p className="text-sm font-semibold text-white mb-2">New Client Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Name *</label>
                <input required type="text" className={inputCls} placeholder="Acme Corp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Email</label>
                <input type="email" className={inputCls} placeholder="hello@acmecorp.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Phone</label>
                <input type="tel" className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Address</label>
                <input type="text" className={inputCls} placeholder="123 Main St, City" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="glow-button-primary px-5 py-2 rounded-xl text-sm font-medium">
                {isSubmitting ? 'Saving…' : 'Save Client'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="glow-button px-5 py-2 rounded-xl text-sm font-medium">Cancel</button>
            </div>
          </form>
        )}

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
          <input type="text" className="premium-input block w-full rounded-xl py-2.5 pl-10 pr-4 text-sm" placeholder="Search clients…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl py-16 text-center">
            <p className="text-zinc-500 text-sm">No clients found.</p>
            <button onClick={() => setShowForm(true)} className="text-purple-400 text-sm mt-2 hover:underline">Add your first client →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(client => (
              <div key={client.id} className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-white/15 transition-all">
                <div className="flex items-center space-x-3 lg:space-x-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/40 to-purple-800/40 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-purple-300">{client.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{client.name}</p>
                    <div className="flex items-center flex-wrap gap-2 lg:gap-3 mt-0.5">
                      {client.email && <span className="text-xs text-zinc-500 flex items-center gap-1"><Mail className="w-3 h-3" /><span className="truncate max-w-[120px]">{client.email}</span></span>}
                      {client.phone && <span className="text-xs text-zinc-500 flex items-center gap-1 hidden sm:flex"><Phone className="w-3 h-3" />{client.phone}</span>}
                      {client.address && <span className="text-xs text-zinc-500 flex items-center gap-1 hidden md:flex"><MapPin className="w-3 h-3" />{client.address}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(client.id)}
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20 shrink-0 ml-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
