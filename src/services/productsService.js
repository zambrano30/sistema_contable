import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Fetch all products
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getAllProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
}

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function getProductById(id) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
}

/**
 * Create a new product
 * @param {Object} product - Product object {name, description, price, quantity, sku}
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function createProduct(product) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('products').insert([product]).select()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data[0] }
}

/**
 * Update a product
 * @param {number} id - Product ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function updateProduct(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data[0] }
}

/**
 * Delete a product
 * @param {number} id - Product ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteProduct(id) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
