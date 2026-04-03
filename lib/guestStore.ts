// ─── Guest Store ──────────────────────────────────────────────────────────────
// All localStorage operations for unauthenticated (guest) users.
// Guests get a real browser-local experience; on sign-up data migrates to Supabase.

const KEYS = {
  PROFILE: 'invtool_profile',
  DOCS: 'invtool_docs',
  CLIENTS: 'invtool_clients',
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestProfile {
  company_name: string
  address: string
  tax_id: string
  bank_details: string
  logo_url: string           // Supabase public URL (if available)
  logo_data_url: string      // base64 — used for reliable print rendering
  signature_url: string      // Supabase public URL (if available)
  signature_data_url: string // base64 — used for reliable print rendering
  tax_rate: string
  terms_conditions: string
  refund_policy: string
  late_payment_rules: string
}

export interface GuestLineItem {
  description: string
  qty: number
  rate: number
}

export interface GuestDoc {
  id: string
  type: string
  client_name: string
  client_email: string
  total_amount: number
  status: string
  created_at: string
  invoice_number: string
  template: string
  line_items: GuestLineItem[]
}

export interface GuestClient {
  id: string
  name: string
  email: string
  address: string
  phone: string
  created_at: string
}

const EMPTY_PROFILE: GuestProfile = {
  company_name: '', address: '', tax_id: '', bank_details: '',
  logo_url: '', logo_data_url: '', signature_url: '', signature_data_url: '',
  tax_rate: '', terms_conditions: '', refund_policy: '', late_payment_rules: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota exceeded */ }
}

// Convert a File to a base64 data URL (for reliable print/PDF rendering)
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const guestStore = {
  // Profile
  getProfile(): GuestProfile {
    return read<GuestProfile>(KEYS.PROFILE, EMPTY_PROFILE)
  },
  saveProfile(profile: Partial<GuestProfile>) {
    const current = this.getProfile()
    write(KEYS.PROFILE, { ...current, ...profile })
  },

  // Documents
  getDocs(): GuestDoc[] {
    return read<GuestDoc[]>(KEYS.DOCS, [])
  },
  addDoc(doc: GuestDoc) {
    const docs = this.getDocs()
    write(KEYS.DOCS, [doc, ...docs])
    return doc
  },
  updateDocStatus(id: string, status: string) {
    const docs = this.getDocs().map(d => d.id === id ? { ...d, status } : d)
    write(KEYS.DOCS, docs)
  },

  // Clients
  getClients(): GuestClient[] {
    return read<GuestClient[]>(KEYS.CLIENTS, [])
  },
  addClient(client: GuestClient) {
    const clients = this.getClients()
    write(KEYS.CLIENTS, [client, ...clients])
  },
  deleteClient(id: string) {
    write(KEYS.CLIENTS, this.getClients().filter(c => c.id !== id))
  },

  // Clear everything after migration
  clearAll() {
    if (typeof window === 'undefined') return
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },

  hasData(): boolean {
    const profile = this.getProfile()
    const docs = this.getDocs()
    return !!(profile.company_name || docs.length > 0)
  },
}
