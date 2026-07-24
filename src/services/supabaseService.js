import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Test connection to Supabase
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function pingSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { error } = await supabase.auth.getSession()

  if (error) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return { ok: true }
}

/**
 * Fetch rows from a table
 * @param {string} tableName - Name of the table
 * @param {number} limit - Maximum number of rows to fetch (default: 10)
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getRows(tableName, limit = 10) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  if (!tableName?.trim()) {
    return {
      ok: false,
      error: 'Table name is required.',
    }
  }

  const { data, error } = await supabase
    .from(tableName.trim())
    .select('*')
    .limit(limit)

  if (error) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
    data,
  }
}