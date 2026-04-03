'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Upload, X, ImageIcon } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase'

// ─── Reusable Image Upload Widget ─────────────────────────────────────────────
function ImageUpload({
  label,
  currentUrl,
  onUpload,
  hint,
}: {
  label: string
  currentUrl: string
  onUpload: (url: string) => void
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5 MB'); return }
    setError(null)
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${label.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('assets').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('assets').getPublicUrl(path)
      onUpload(data.publicUrl)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/3 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentUrl
            ? <img src={currentUrl} alt={label} className="w-full h-full object-contain p-1" />
            : <ImageIcon className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="glow-button flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading…' : 'Upload Image'}
            </button>
            {currentUrl && (
              <button
                type="button"
                onClick={() => onUpload('')}
                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {hint && <p className="text-xs text-zinc-600">{hint}</p>}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          {currentUrl && (
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Uploaded successfully
            </p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
export default function Settings() {
  const [existingId, setExistingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    company_name: '',
    address: '',
    tax_id: '',
    bank_details: '',
    logo_url: '',
    signature_url: '',
    tax_rate: '',
    terms_conditions: '',
    refund_policy: '',
    late_payment_rules: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('*').limit(1).single()
      if (data) {
        setExistingId(data.id)
        setForm({
          company_name: data.company_name || '',
          address: data.address || '',
          tax_id: data.tax_id || '',
          bank_details: data.bank_details || '',
          logo_url: data.logo_url || '',
          signature_url: data.signature_url || '',
          tax_rate: data.tax_rate?.toString() || '',
          terms_conditions: data.terms_conditions || '',
          refund_policy: data.refund_policy || '',
          late_payment_rules: data.late_payment_rules || '',
        })
      }
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSaved(false)
    const payload = {
      company_name: form.company_name,
      address: form.address,
      tax_id: form.tax_id,
      bank_details: form.bank_details,
      logo_url: form.logo_url || null,
      signature_url: form.signature_url || null,
      tax_rate: parseFloat(form.tax_rate) || 0,
      terms_conditions: form.terms_conditions || null,
      refund_policy: form.refund_policy || null,
      late_payment_rules: form.late_payment_rules || null,
      updated_at: new Date().toISOString(),
    }

    let err = null
    if (existingId) {
      const { error: e } = await supabase.from('profiles').update(payload).eq('id', existingId)
      err = e
    } else {
      const { error: e, data } = await supabase.from('profiles').insert([payload]).select().single()
      err = e
      if (data) setExistingId(data.id)
    }
    if (err) setError(err.message)
    else setSaved(true)
    setIsSubmitting(false)
  }

  const inputCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm'
  const textareaCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm resize-none'
  const labelCls = 'block text-xs text-zinc-500 uppercase tracking-wider mb-1.5'

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5 pb-3 border-b border-white/5">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient-silver tracking-tight">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your brand profile and global document segments</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          <Section title="Brand Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Company Name</label>
                <input type="text" className={inputCls} value={form.company_name} onChange={set('company_name')} placeholder="Switch Studio" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <input type="text" className={inputCls} value={form.address} onChange={set('address')} placeholder="123 Creative Blvd, Mumbai" />
              </div>
              <div>
                <label className={labelCls}>Tax ID / GST</label>
                <input type="text" className={inputCls} value={form.tax_id} onChange={set('tax_id')} placeholder="GSTIN / PAN" />
              </div>
              <div>
                <label className={labelCls}>Tax Rate (%)</label>
                <input type="number" className={inputCls} value={form.tax_rate} onChange={set('tax_rate')} placeholder="18" min="0" max="100" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Bank Details</label>
                <input type="text" className={inputCls} value={form.bank_details} onChange={set('bank_details')} placeholder="A/C No, IFSC, Bank Name" />
              </div>
            </div>
          </Section>

          <Section title="Brand Assets">
            <ImageUpload
              label="Company Logo"
              currentUrl={form.logo_url}
              onUpload={url => setForm(prev => ({ ...prev, logo_url: url }))}
              hint="PNG, JPG, SVG or WebP · Max 5 MB · Shown on all generated documents"
            />
            <ImageUpload
              label="Digital Signature"
              currentUrl={form.signature_url}
              onUpload={url => setForm(prev => ({ ...prev, signature_url: url }))}
              hint="PNG with transparent background recommended · Appears at document footer"
            />
          </Section>

          <Section title="Global Segments">
            <div>
              <label className={labelCls}>Terms & Conditions</label>
              <textarea rows={3} className={textareaCls} value={form.terms_conditions} onChange={set('terms_conditions')} placeholder="Payment is due within 14 days..." />
            </div>
            <div>
              <label className={labelCls}>Refund Policy</label>
              <textarea rows={2} className={textareaCls} value={form.refund_policy} onChange={set('refund_policy')} placeholder="No refunds after deliverables approved..." />
            </div>
            <div>
              <label className={labelCls}>Late Payment Rules</label>
              <textarea rows={2} className={textareaCls} value={form.late_payment_rules} onChange={set('late_payment_rules')} placeholder="2% monthly interest on overdue balances..." />
            </div>
          </Section>

          {error && <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">{error}</div>}

          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Settings saved successfully
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="glow-button-primary w-full py-3 rounded-xl text-sm font-semibold">
            {isSubmitting ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
