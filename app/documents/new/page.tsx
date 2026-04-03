'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, ChevronRight, ChevronLeft, Printer, CheckCircle2 } from 'lucide-react'
import AppLayout from '../../../components/AppLayout'
import { supabase } from '../../../lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

type TemplateKey = 'modern_agency' | 'architect' | 'cosmetic' | 'classic' | 'dark_mode'

interface LineItem {
  description: string
  qty: number
  rate: number
}

interface Profile {
  id: string
  company_name: string
  address: string
  tax_id: string
  bank_details: string
  logo_url: string
  signature_url: string
  tax_rate: number
  terms_conditions: string
  refund_policy: string
  late_payment_rules: string
}

interface SavedClient {
  id: string
  name: string
  email: string
  address: string
  phone: string
}

// ─── Template Definitions ────────────────────────────────────────────────────

const TEMPLATES: Record<TemplateKey, { name: string; bg: string; text: string; muted: string; border: string; accent: string; headingClass: string; font: string }> = {
  modern_agency: {
    name: 'Modern Agency', bg: '#FFFFFF', text: '#111827', muted: '#6B7280',
    border: '#E5E7EB', accent: '#111827', headingClass: 'text-2xl font-bold tracking-tighter uppercase', font: 'Inter, sans-serif',
  },
  architect: {
    name: 'The Architect', bg: '#FAFAF9', text: '#1C1917', muted: '#78716C',
    border: '#D4D0CB', accent: '#292524', headingClass: 'text-2xl font-light tracking-[0.2em] uppercase', font: 'Georgia, serif',
  },
  cosmetic: {
    name: 'The Cosmetic', bg: '#FFF8F6', text: '#7C2D12', muted: '#B07F73',
    border: '#FCCFC3', accent: '#C2410C', headingClass: 'text-2xl font-light tracking-wide italic', font: 'Inter, sans-serif',
  },
  classic: {
    name: 'The Classic', bg: '#F8FAFC', text: '#0F172A', muted: '#64748B',
    border: '#CBD5E1', accent: '#1E3A8A', headingClass: 'text-2xl font-bold', font: 'Inter, sans-serif',
  },
  dark_mode: {
    name: 'Dark Mode', bg: '#09090B', text: '#FAFAFA', muted: '#A1A1AA',
    border: '#27272A', accent: '#FFFFFF', headingClass: 'text-2xl font-bold tracking-tight', font: 'Inter, sans-serif',
  },
}

// ─── Document Preview ────────────────────────────────────────────────────────

function DocumentPreview({
  docType, template: tKey, profile, clientDetails, lineItems,
  discount, taxEnabled, advancePaid, notes, agreementDetails, clauses, suggestedFilename,
}: {
  docType: string; template: TemplateKey; profile: Profile | null
  clientDetails: { name: string; email: string; address: string }
  lineItems: LineItem[]; discount: number; taxEnabled: boolean
  advancePaid: number; notes: string; suggestedFilename: string
  agreementDetails: { scope: string; timeline: string; revisions: number; projectName: string; projectId: string; ownershipClause: string }
  clauses: { rushFee: boolean; sourceFiles: boolean; killFee: boolean }
}) {
  const t = TEMPLATES[tKey]
  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.rate, 0)
  const discountAmt = subtotal * (discount / 100)
  const afterDiscount = subtotal - discountAmt
  const taxRate = taxEnabled ? (profile?.tax_rate || 0) : 0
  const taxAmt = afterDiscount * (taxRate / 100)
  const total = afterDiscount + taxAmt
  const balanceDue = total - advancePaid

  const invNumber = `INV-${Date.now().toString().slice(-6)}`

  const cell = (val: string | number, right = false) => (
    <div style={{ color: right ? t.text : t.muted, textAlign: right ? 'right' : 'left', fontSize: 13 }}>{val}</div>
  )

  return (
    <div className="print-preview" style={{ background: t.bg, color: t.text, fontFamily: t.font, padding: 40, minHeight: 'calc(297mm)', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: `2px solid ${t.accent}` }}>
        <div>
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="logo" style={{ height: 36, marginBottom: 8 }} />
          ) : (
            <div className={t.headingClass} style={{ color: t.accent, marginBottom: 4 }}>{profile?.company_name || 'Your Company'}</div>
          )}
          <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.6, marginTop: 6 }}>
            <div>{profile?.address}</div>
            {profile?.tax_id && <div>GST: {profile.tax_id}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted }}>{docType}</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 8, lineHeight: 1.8 }}>
            {docType === 'invoice' && <div>Ref: <span style={{ color: t.text, fontWeight: 600 }}>{invNumber}</span></div>}
            {agreementDetails.projectId && <div>Project ID: <span style={{ color: t.text, fontWeight: 600 }}>{agreementDetails.projectId}</span></div>}
            <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.muted, marginBottom: 6 }}>
          {docType === 'invoice' ? 'Bill To' : 'Prepared For'}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{clientDetails.name || 'Client Name'}</div>
        {clientDetails.email && <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{clientDetails.email}</div>}
        {clientDetails.address && <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{clientDetails.address}</div>}
      </div>

      {/* Invoice-specific: Line Items */}
      {docType === 'invoice' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${t.border}` }}>
              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>
            {lineItems.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px', gap: 8, padding: '10px 0', borderBottom: `1px solid ${t.border}33` }}>
                <div style={{ fontSize: 13, color: t.text }}>{item.description || '—'}</div>
                <div style={{ fontSize: 13, color: t.muted, textAlign: 'right' }}>{item.qty}</div>
                <div style={{ fontSize: 13, color: t.muted, textAlign: 'right' }}>₹{item.rate.toFixed(2)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text, textAlign: 'right' }}>₹{(item.qty * item.rate).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <div style={{ width: 240 }}>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted, marginBottom: 6 }}>
                  <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted, marginBottom: 6 }}>
                  <span>Discount ({discount}%)</span><span>−₹{discountAmt.toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted, marginBottom: 6 }}>
                  <span>Tax ({taxRate}%)</span><span>₹{taxAmt.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: t.text, padding: '10px 0', borderTop: `2px solid ${t.accent}` }}>
                <span>Total</span><span>₹{total.toFixed(2)}</span>
              </div>
              {advancePaid > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.muted, marginTop: 6 }}>
                  <span>Advance Received</span><span>₹{advancePaid.toFixed(2)}</span>
                </div>
              )}
              {advancePaid > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#10B981', marginTop: 6, paddingTop: 6, borderTop: `1px solid ${t.border}` }}>
                  <span>Balance Due</span><span>₹{balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank + Notes */}
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {profile?.bank_details && (
              <div style={{ flex: 1, background: tKey === 'dark_mode' ? '#18181b' : '#f9fafb', border: `1px solid ${t.border}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Bank Details</div>
                <div style={{ fontSize: 12, color: t.text, lineHeight: 1.6 }}>{profile.bank_details}</div>
              </div>
            )}
            {notes && (
              <div style={{ flex: 1, background: tKey === 'dark_mode' ? '#18181b' : '#f9fafb', border: `1px solid ${t.border}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 12, color: t.text, lineHeight: 1.6 }}>{notes}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Agreement-specific */}
      {docType === 'agreement' && (
        <div style={{ lineHeight: 1.8, fontSize: 13, color: t.text }}>
          {agreementDetails.projectName && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Project</div>
              <div style={{ fontWeight: 600 }}>{agreementDetails.projectName}</div>
            </div>
          )}
          {agreementDetails.scope && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Scope of Work</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{agreementDetails.scope}</div>
            </div>
          )}
          {agreementDetails.timeline && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Timeline</div>
              <div>{agreementDetails.timeline}</div>
            </div>
          )}
          {agreementDetails.revisions > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Revision Limit</div>
              <div>{agreementDetails.revisions} rounds of revisions</div>
            </div>
          )}
          {agreementDetails.ownershipClause && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>Ownership & Copyright</div>
              <div>{agreementDetails.ownershipClause}</div>
            </div>
          )}
          {/* Modular Clauses */}
          {clauses.rushFee && (
            <div style={{ marginBottom: 12, padding: '10px 14px', border: `1px solid ${t.border}`, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: t.accent, marginBottom: 4 }}>Rush Fee Clause</div>
              <div style={{ color: t.muted }}>Work requested within 48 hours of the agreed timeline will incur a 25% rush fee on the total project value.</div>
            </div>
          )}
          {clauses.sourceFiles && (
            <div style={{ marginBottom: 12, padding: '10px 14px', border: `1px solid ${t.border}`, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: t.accent, marginBottom: 4 }}>Source File Delivery</div>
              <div style={{ color: t.muted }}>Source files (editable formats) will be delivered upon receipt of final payment. Interim files are not included unless separately agreed.</div>
            </div>
          )}
          {clauses.killFee && (
            <div style={{ marginBottom: 12, padding: '10px 14px', border: `1px solid ${t.border}`, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: t.accent, marginBottom: 4 }}>Kill Fee</div>
              <div style={{ color: t.muted }}>If the project is cancelled after work has commenced, a kill fee of 50% of the agreed total is due within 7 days of cancellation.</div>
            </div>
          )}
          {/* Global Terms */}
          {profile?.terms_conditions && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: 8 }}>Terms & Conditions</div>
              <div style={{ color: t.muted, fontSize: 11 }}>{profile.terms_conditions}</div>
            </div>
          )}
        </div>
      )}

      {/* Signature Area */}
      <div style={{ marginTop: docType === 'invoice' ? 32 : 48, display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center', width: 200 }}>
          {profile?.signature_url ? (
            <img src={profile.signature_url} alt="Signature" style={{ maxHeight: 60, margin: '0 auto', marginBottom: 8 }} />
          ) : (
            <div style={{ height: 60, borderBottom: `1px solid ${t.border}`, marginBottom: 8 }} />
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: t.text }}>{profile?.company_name || 'Authorized Signatory'}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 32, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: t.muted }}>
          Generated by Switch Studio • {new Date().toLocaleDateString()}
        </div>
        {suggestedFilename && (
          <div style={{ fontSize: 10, color: t.muted, fontFamily: 'monospace' }}>{suggestedFilename}</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

function DocumentBuilderInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const docType = searchParams.get('type') || 'invoice'

  const [step, setStep] = useState(1)
  const totalSteps = docType === 'invoice' ? 3 : 4

  const [profile, setProfile] = useState<Profile | null>(null)
  const [savedClients, setSavedClients] = useState<SavedClient[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [clientDetails, setClientDetails] = useState({ name: '', email: '', address: '' })
  const [selectedClientId, setSelectedClientId] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', qty: 1, rate: 0 }])
  const [discount, setDiscount] = useState(0)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [advancePaid, setAdvancePaid] = useState(0)
  const [notes, setNotes] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('modern_agency')
  const [agreementDetails, setAgreementDetails] = useState({
    projectName: '', projectId: '', scope: '', timeline: '', revisions: 2, ownershipClause: 'Full ownership transfers to client upon final payment.',
  })
  const [clauses, setClauses] = useState({ rushFee: false, sourceFiles: false, killFee: false })

  // Derived
  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.rate, 0)
  const discountAmt = subtotal * (discount / 100)
  const afterDiscount = subtotal - discountAmt
  const taxRate = taxEnabled ? (profile?.tax_rate || 0) : 0
  const taxAmt = afterDiscount * (taxRate / 100)
  const total = afterDiscount + taxAmt
  const balanceDue = total - advancePaid

  const suggestedFilename = `${(clientDetails.name || 'Client').replace(/\s+/g, '_')}_${docType === 'invoice' ? 'Invoice' : 'Agreement'}_v1.pdf`

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (p) {
        setProfile(p)
        const { data: c } = await supabase.from('clients').select('*').eq('profile_id', p.id).order('name')
        if (c) setSavedClients(c)
      }
    }
    load()
  }, [])

  const onClientSelect = (id: string) => {
    setSelectedClientId(id)
    const c = savedClients.find((c) => c.id === id)
    if (c) setClientDetails({ name: c.name, email: c.email || '', address: c.address || '' })
  }

  const addItem = () => setLineItems([...lineItems, { description: '', qty: 1, rate: 0 }])
  const removeItem = (i: number) => lineItems.length > 1 && setLineItems(lineItems.filter((_, idx) => idx !== i))
  const updateItem = (i: number, k: keyof LineItem, v: any) => {
    const next = [...lineItems]
    next[i] = { ...next[i], [k]: v }
    setLineItems(next)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      if (!profile) throw new Error('Complete onboarding first.')

      const invNumber = `INV-${Date.now().toString().slice(-6)}`
      const { data: doc, error: docErr } = await supabase.from('documents').insert([{
        profile_id: profile.id,
        type: docType,
        client_name: clientDetails.name,
        client_email: clientDetails.email,
        total_amount: total,
        balance_due: balanceDue,
        discount,
        advance_paid: advancePaid,
        status: 'draft',
        template,
        notes: notes || null,
        invoice_number: docType === 'invoice' ? invNumber : null,
        project_id: agreementDetails.projectId || null,
      }]).select().single()

      if (docErr) throw docErr

      if (docType === 'invoice') {
        await supabase.from('line_items').insert(
          lineItems.map((item) => ({ doc_id: doc.id, description: item.description, rate: item.rate, quantity: item.qty }))
        )
      } else {
        await supabase.from('agreements_meta').insert([{
          doc_id: doc.id,
          scope: agreementDetails.scope,
          timeline: agreementDetails.timeline,
          revisions: agreementDetails.revisions,
          revision_limit: agreementDetails.revisions,
          ownership_clause: agreementDetails.ownershipClause,
          rush_fee_enabled: clauses.rushFee,
          source_file_delivery: clauses.sourceFiles,
          kill_fee_enabled: clauses.killFee,
        }])
      }

      setSuccess(true)
    } catch (err: any) {
      alert(err.message || 'An error occurred saving the document.')
    }
    setIsSubmitting(false)
  }

  const inputCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm'
  const textareaCls = 'premium-input block w-full rounded-xl py-2.5 px-4 text-sm resize-none'
  const labelCls = 'block text-xs text-zinc-500 uppercase tracking-wider mb-1.5'

  // ─── Step Indicator ───────────────────────────────────────────────────────
  const STEP_LABELS: Record<string, string[]> = {
    invoice: ['Client', 'Items', 'Preview'],
    agreement: ['Client', 'Terms', 'Clauses', 'Preview'],
  }
  const stepLabels = STEP_LABELS[docType]

  if (success) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white capitalize">{docType} Created!</h2>
            <p className="text-zinc-400 text-sm">Saved as a draft. Smart filename:<br /><code className="text-purple-400 text-xs">{suggestedFilename}</code></p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => router.push('/documents')} className="glow-button-primary px-5 py-2.5 rounded-xl text-sm font-medium">View Documents</button>
              <button onClick={() => router.push('/')} className="glow-button px-5 py-2.5 rounded-xl text-sm font-medium">Dashboard</button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout noscroll>
      {/* Top Bar */}
      <div className="no-print flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white capitalize">New {docType}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1 text-xs ${i + 1 === step ? 'text-white font-medium' : i + 1 < step ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    <span className={`w-4 h-4 rounded-full border text-[10px] flex items-center justify-center font-bold ${i + 1 === step ? 'border-purple-400 text-purple-400' : i + 1 < step ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400' : 'border-zinc-700 text-zinc-600'}`}>
                      {i + 1 < step ? '✓' : i + 1}
                    </span>
                    {label}
                  </div>
                  {i < stepLabels.length - 1 && <div className="w-8 h-px bg-zinc-800" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 font-mono truncate max-w-[180px]">{suggestedFilename}</span>
          <button
            onClick={() => window.print()}
            className="glow-button flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="no-print flex flex-1 overflow-hidden">
        {/* ── Left: Form ────────────────────────────────── */}
        <div className="w-full lg:w-[45%] overflow-y-auto p-6 space-y-5 border-r border-white/5">

          {/* ─ STEP 1: Client ─ */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gradient-silver">Client Information</p>

              {savedClients.length > 0 && (
                <div>
                  <label className={labelCls}>Autofill from saved clients</label>
                  <select
                    className={inputCls}
                    value={selectedClientId}
                    onChange={(e) => onClientSelect(e.target.value)}
                  >
                    <option value="">— Select a client —</option>
                    {savedClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>Client Name *</label>
                <input required type="text" className={inputCls} placeholder="Acme Corp" value={clientDetails.name} onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Client Email</label>
                <input type="email" className={inputCls} placeholder="hello@acmecorp.com" value={clientDetails.email} onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Client Address</label>
                <input type="text" className={inputCls} placeholder="123 Business Park, City" value={clientDetails.address} onChange={(e) => setClientDetails({ ...clientDetails, address: e.target.value })} />
              </div>

              {docType === 'agreement' && (
                <>
                  <div>
                    <label className={labelCls}>Project Name</label>
                    <input type="text" className={inputCls} placeholder="Brand Redesign Q2" value={agreementDetails.projectName} onChange={(e) => setAgreementDetails({ ...agreementDetails, projectName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Project ID</label>
                    <input type="text" className={inputCls} placeholder="SS-2025-001" value={agreementDetails.projectId} onChange={(e) => setAgreementDetails({ ...agreementDetails, projectId: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─ STEP 2: Invoice → Line Items | Agreement → Terms ─ */}
          {step === 2 && docType === 'invoice' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gradient-silver">Line Items</p>

              <div className="space-y-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Item {i + 1}</span>
                      {lineItems.length > 1 && (
                        <button onClick={() => removeItem(i)} className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <input type="text" className={inputCls} placeholder="e.g. Brand Identity Design" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Quantity</label>
                        <input type="number" min="1" className={inputCls} value={item.qty} onChange={(e) => updateItem(i, 'qty', parseFloat(e.target.value) || 1)} />
                      </div>
                      <div>
                        <label className={labelCls}>Rate (₹)</label>
                        <input type="number" min="0" className={inputCls} value={item.rate} onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="text-right text-xs text-zinc-400">
                      Subtotal: <span className="text-white font-semibold">₹{(item.qty * item.rate).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addItem} className="dashed-add w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </button>

              <div className="glass-card rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Financials</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Discount (%)</label>
                    <input type="number" min="0" max="100" className={inputCls} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={labelCls}>Advance Paid (₹)</label>
                    <input type="number" min="0" className={inputCls} value={advancePaid} onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <label className="text-xs text-zinc-400">Apply Tax ({profile?.tax_rate || 0}%)</label>
                  <button
                    type="button"
                    onClick={() => setTaxEnabled(!taxEnabled)}
                    className={`w-10 h-5 rounded-full transition-all border ${taxEnabled ? 'bg-purple-500 border-purple-400' : 'bg-zinc-800 border-zinc-700'} relative`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${taxEnabled ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
                {/* Summary */}
                <div className="space-y-1 text-xs pt-2 border-t border-white/5">
                  <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-zinc-500"><span>Discount</span><span>−₹{discountAmt.toFixed(2)}</span></div>}
                  {taxEnabled && taxRate > 0 && <div className="flex justify-between text-zinc-500"><span>Tax ({taxRate}%)</span><span>₹{taxAmt.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-white font-semibold pt-1 border-t border-white/5"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                  {advancePaid > 0 && <div className="flex justify-between text-emerald-400 font-semibold"><span>Balance Due</span><span>₹{balanceDue.toFixed(2)}</span></div>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} className={textareaCls} placeholder="Any special instructions or terms for this invoice…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && docType === 'agreement' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gradient-silver">Agreement Terms</p>
              <div>
                <label className={labelCls}>Scope of Work *</label>
                <textarea rows={4} className={textareaCls} placeholder="Describe the deliverables and work to be performed…" value={agreementDetails.scope} onChange={(e) => setAgreementDetails({ ...agreementDetails, scope: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Timeline / Deadlines</label>
                <input type="text" className={inputCls} placeholder="e.g. 4 weeks from kickoff, Final delivery April 30" value={agreementDetails.timeline} onChange={(e) => setAgreementDetails({ ...agreementDetails, timeline: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Revision Rounds</label>
                <input type="number" min="0" className={inputCls} value={agreementDetails.revisions} onChange={(e) => setAgreementDetails({ ...agreementDetails, revisions: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className={labelCls}>Ownership / Copyright Clause</label>
                <textarea rows={2} className={textareaCls} value={agreementDetails.ownershipClause} onChange={(e) => setAgreementDetails({ ...agreementDetails, ownershipClause: e.target.value })} />
              </div>
            </div>
          )}

          {/* ─ STEP 3 (agreement only): Modular Clauses ─ */}
          {step === 3 && docType === 'agreement' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gradient-silver">Modular Clauses</p>
              <p className="text-xs text-zinc-500">Toggle optional clauses to include in the agreement.</p>

              {([
                { key: 'rushFee', label: 'Rush Fee', desc: '25% surcharge for work needed within 48 hours of agreed timeline.' },
                { key: 'sourceFiles', label: 'Source File Delivery', desc: 'Source files delivered after final payment only.' },
                { key: 'killFee', label: 'Kill Fee', desc: '50% due if project is cancelled after commencement.' },
              ] as const).map((clause) => (
                <div
                  key={clause.key}
                  onClick={() => setClauses((prev) => ({ ...prev, [clause.key]: !prev[clause.key] }))}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${clauses[clause.key] ? 'border-purple-500/30 bg-purple-500/5' : 'hover:border-white/15'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{clause.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{clause.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-4 ${clauses[clause.key] ? 'bg-purple-500 border-purple-400' : 'border-zinc-700'}`}>
                      {clauses[clause.key] && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─ FINAL STEP: Template + Save ─ */}
          {step === totalSteps && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gradient-silver">Choose Template</p>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(TEMPLATES) as [TemplateKey, any][]).map(([key, tmpl]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTemplate(key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${template === key ? 'border-purple-500/40 bg-purple-500/8' : 'border-white/6 hover:border-white/12'}`}
                  >
                    {/* Mini swatch */}
                    <div className="w-10 h-7 rounded-lg flex-shrink-0 border border-white/10" style={{ background: tmpl.bg }} />
                    <div>
                      <p className={`text-sm font-medium ${template === key ? 'text-purple-300' : 'text-zinc-300'}`}>{tmpl.name}</p>
                      <p className="text-xs text-zinc-600" style={{ fontFamily: tmpl.font }}>Aα Bb Cc 123</p>
                    </div>
                    {template === key && <CheckCircle2 className="w-4 h-4 text-purple-400 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-xs text-zinc-600 mb-2">Suggested filename:</p>
                <code className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg block">{suggestedFilename}</code>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="glow-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!clientDetails.name}
                className="glow-button-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSubmitting || !clientDetails.name}
                className="glow-button-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
              >
                {isSubmitting ? 'Saving…' : 'Save Draft'}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Live Preview ────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 overflow-hidden bg-[#F0F0F0]">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-200 border-b border-zinc-300 no-print">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Live Preview</span>
            <span className="text-xs text-zinc-400 font-mono">{TEMPLATES[template].name}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="min-h-full shadow-xl rounded overflow-hidden" style={{ transform: 'scale(0.85)', transformOrigin: 'top center', minHeight: 800 }}>
              <DocumentPreview
                docType={docType}
                template={template}
                profile={profile}
                clientDetails={clientDetails}
                lineItems={lineItems}
                discount={discount}
                taxEnabled={taxEnabled}
                advancePaid={advancePaid}
                notes={notes}
                agreementDetails={agreementDetails}
                clauses={clauses}
                suggestedFilename={suggestedFilename}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden full-page print target */}
      <div className="hidden print:block">
        <DocumentPreview
          docType={docType}
          template={template}
          profile={profile}
          clientDetails={clientDetails}
          lineItems={lineItems}
          discount={discount}
          taxEnabled={taxEnabled}
          advancePaid={advancePaid}
          notes={notes}
          agreementDetails={agreementDetails}
          clauses={clauses}
          suggestedFilename={suggestedFilename}
        />
      </div>
    </AppLayout>
  )
}

export default function DocumentBuilderPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-zinc-500 text-sm">Loading builder…</div>
        </div>
      </AppLayout>
    }>
      <DocumentBuilderInner />
    </Suspense>
  )
}
