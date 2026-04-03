'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, MapPin, Receipt, CreditCard, CheckCircle2, Percent, RotateCcw, Upload, X, ImageIcon } from 'lucide-react'
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
        {/* Preview */}
        <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/3 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentUrl
            ? <img src={currentUrl} alt={label} className="w-full h-full object-contain p-1" />
            : <ImageIcon className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />}
        </div>
        {/* Controls */}
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
              <CheckCircle2 className="w-3 h-3" /> Uploaded
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)

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
    const fetchProfile = async () => {
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
    fetchProfile()
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
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
      const { error: uErr } = await supabase.from('profiles').update(payload).eq('id', existingId)
      err = uErr
    } else {
      const { error: iErr } = await supabase.from('profiles').insert([payload])
      err = iErr
    }

    if (err) setError(err.message)
    else setSaved(true)
    setIsSubmitting(false)
  }

  const inputCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm'
  const textareaCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm resize-none'
  const labelCls = 'block text-xs text-zinc-500 uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative ambient-bg">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs text-zinc-400">{existingId ? 'Edit your' : 'Setup your'} workspace</span>
          </div>
          <h1 className="text-4xl font-bold text-gradient-silver tracking-tight">Brand Profile</h1>
          <p className="text-zinc-500 text-sm mt-2">Configure Switch Studio with your agency details</p>
        </div>

        {saved ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Profile Saved!</h2>
            <p className="text-zinc-400 text-sm">Your brand configuration is ready.</p>
            <div className="flex gap-3 justify-center pt-2">
              <a href="/" className="glow-button-primary px-6 py-2.5 rounded-xl text-sm font-medium">Go to Dashboard</a>
              <button onClick={() => setSaved(false)} className="glow-button px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Edit Again
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">

            {/* Section: Company */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">Company Info</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Company Name *</label>
                    <input required type="text" className={inputCls} placeholder="Switch Studio" value={form.company_name} onChange={set('company_name')} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Address</label>
                    <input type="text" className={inputCls} placeholder="123 Creative Blvd, Mumbai 400001" value={form.address} onChange={set('address')} />
                  </div>
                  <div>
                    <label className={labelCls}>Tax ID / GST</label>
                    <input type="text" className={inputCls} placeholder="GSTIN / PAN" value={form.tax_id} onChange={set('tax_id')} />
                  </div>
                  <div>
                    <label className={labelCls}>Tax Rate (%)</label>
                    <input type="number" min="0" max="100" step="0.01" className={inputCls} placeholder="18" value={form.tax_rate} onChange={set('tax_rate')} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Bank Details</label>
                    <input type="text" className={inputCls} placeholder="A/C No, IFSC, Bank Name" value={form.bank_details} onChange={set('bank_details')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Brand Assets (Upload) */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">Brand Assets</p>
              <div className="space-y-5">
                <ImageUpload
                  label="Company Logo"
                  currentUrl={form.logo_url}
                  onUpload={url => setForm(prev => ({ ...prev, logo_url: url }))}
                  hint="PNG, JPG, SVG or WebP · Max 5 MB · Shown on invoices & agreements"
                />
                <ImageUpload
                  label="Digital Signature"
                  currentUrl={form.signature_url}
                  onUpload={url => setForm(prev => ({ ...prev, signature_url: url }))}
                  hint="PNG with transparent background recommended · Appears at document footer"
                />
              </div>
            </div>

            {/* Section: Global Segments */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">Global Segments</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Terms & Conditions</label>
                  <textarea rows={3} className={textareaCls} placeholder="Payment is due within 14 days of the invoice date…" value={form.terms_conditions} onChange={set('terms_conditions')} />
                </div>
                <div>
                  <label className={labelCls}>Refund Policy</label>
                  <textarea rows={2} className={textareaCls} placeholder="No refunds after project deliverables have been approved…" value={form.refund_policy} onChange={set('refund_policy')} />
                </div>
                <div>
                  <label className={labelCls}>Late Payment Rules</label>
                  <textarea rows={2} className={textareaCls} placeholder="A 2% monthly interest will be applied on overdue balances…" value={form.late_payment_rules} onChange={set('late_payment_rules')} />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="glow-button-primary w-full py-3 rounded-xl text-sm font-semibold tracking-wide">
              {isSubmitting ? 'Saving…' : existingId ? 'Update Profile' : 'Save & Get Started'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
