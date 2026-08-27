import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserExists } from './userService'

export async function getAllProviders() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export async function createProvider(name) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const userExists = await ensureUserExists()
    if (!userExists) return { ok: false, error: 'Could not verify user in database' }

    const { data, error } = await supabase
      .from('providers')
      .insert([{ name: name.trim(), is_active: true }])
      .select('*')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
