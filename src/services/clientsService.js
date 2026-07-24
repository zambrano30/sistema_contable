import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Fetch all clients
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getAllClients() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
}

/**
 * Get a single client by ID
 * @param {number} id - Client ID
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function getClientById(id) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
}

/**
 * Create a new client
 * @param {Object} client - Client object {name, email, phone, address}
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function createClient(client) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('clients').insert([client]).select()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data[0] }
}

/**
 * Update a client
 * @param {number} id - Client ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function updateClient(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data[0] }
}

/**
 * Delete a client
 * @param {number} id - Client ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteClient(id) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
