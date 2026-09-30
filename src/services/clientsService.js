import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getActiveCompanyId } from './companyService'
import { ensureUserExists } from './userService'

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

  try {
    const companyId = getActiveCompanyId()
    if (!companyId) return { ok: false, error: 'Selecciona una empresa antes de ver clientes' }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      // Database query failed - log details for debugging
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (err) {
    // Handle unexpected errors silently
    return { ok: false, error: err.message }
  }
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
 * @param {Object} client - Client object {name, email, phone, address, ...}
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function createClient(client) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  try {
    // Ensure user exists in users table before creating client
    const userExists = await ensureUserExists()
    if (!userExists) {
      return { ok: false, error: 'Could not verify user in database' }
    }

    const companyId = getActiveCompanyId()
    if (!companyId) return { ok: false, error: 'Selecciona una empresa antes de crear clientes' }

    const clientData = {
      company_id: companyId,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || 'Colombia',
      tax_id: client.tax_id || '',
      is_active: true,
    }

    const { data, error } = await supabase.from('clients').insert([clientData]).select('*')

    if (error) {
      // Database insert failed - log details for debugging
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data[0] }
  } catch (err) {
    // Handle unexpected errors silently
    return { ok: false, error: err.message }
  }
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

  const updateData = {
    name: updates.name,
    email: updates.email || '',
    phone: updates.phone || '',
    address: updates.address || '',
    city: updates.city || '',
    country: updates.country || 'Colombia',
    tax_id: updates.tax_id || '',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data[0] }
}

/**
 * Delete a client (soft delete - marks as inactive)
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

  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
