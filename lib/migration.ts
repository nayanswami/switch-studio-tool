// ─── Data Migration: Guest localStorage → Supabase ───────────────────────────
// Called once after a guest successfully signs up or logs in.
// Moves all their local data to the cloud under their new user_id.

import { supabase } from './supabase'
import { guestStore } from './guestStore'
import type { User } from '@supabase/supabase-js'

export async function migrateGuestData(user: User): Promise<void> {
  const profile = guestStore.getProfile()
  const docs = guestStore.getDocs()
  const clients = guestStore.getClients()

  // Nothing to migrate
  if (!profile.company_name && docs.length === 0 && clients.length === 0) return

  try {
    // 1. Check if this user already has a profile (returning user log-in case)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let profileId: string

    if (existing) {
      profileId = existing.id
    } else {
      // 2. Create Supabase profile from guest data
      const { data: savedProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          company_name: profile.company_name || 'My Company',
          address: profile.address || null,
          tax_id: profile.tax_id || null,
          bank_details: profile.bank_details || null,
          logo_url: profile.logo_url || null,
          logo_data_url: profile.logo_data_url || null,
          signature_url: profile.signature_url || null,
          signature_data_url: profile.signature_data_url || null,
          tax_rate: parseFloat(profile.tax_rate) || 0,
          terms_conditions: profile.terms_conditions || null,
          refund_policy: profile.refund_policy || null,
          late_payment_rules: profile.late_payment_rules || null,
        })
        .select()
        .single()

      if (profileErr || !savedProfile) {
        console.error('Migration: profile insert failed', profileErr)
        return
      }
      profileId = savedProfile.id
    }

    // 3. Migrate clients
    for (const client of clients) {
      const { id: _id, ...clientData } = client
      await supabase.from('clients').insert({ ...clientData, profile_id: profileId })
    }

    // 4. Migrate documents + line items
    for (const doc of docs) {
      const { line_items, id: _id, ...docData } = doc
      const { data: savedDoc } = await supabase
        .from('documents')
        .insert({ ...docData, profile_id: profileId })
        .select()
        .single()

      if (savedDoc && line_items?.length) {
        await supabase.from('line_items').insert(
          line_items.map(item => ({
            doc_id: savedDoc.id,
            description: item.description,
            rate: item.rate,
            quantity: item.qty,
          }))
        )
      }
    }

    // 5. Clear localStorage — data now lives in Supabase
    guestStore.clearAll()
  } catch (err) {
    console.error('Guest data migration failed:', err)
    // Don't rethrow — migration failure shouldn't block login
  }
}
