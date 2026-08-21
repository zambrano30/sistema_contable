import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserExists } from './userService'

// Generate a unique SKU
function generateUniqueSKU() {
  return `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

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

  try {
    // First, try simple select without filters to debug
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      // Database query failed
      return { ok: false, error: error.message }
    }

    // Map to legacy format for compatibility
    const mappedData = data?.map(p => ({
      ...p,
      price: p.unit_price,
      quantity: p.quantity_on_hand,
    })) || []

    return { ok: true, data: mappedData }
  } catch (err) {
    // Exception occurred during fetch
    return { ok: false, error: err.message }
  }
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

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

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

  try {
    // Ensure user exists in users table before creating product
    const userExists = await ensureUserExists()
    if (!userExists) {
      return { ok: false, error: 'Could not verify user in database' }
    }

    const productData = {
      name: product.name,
      description: product.description || '',
      sku: product.sku || generateUniqueSKU(), // Generate truly unique SKU
      barcode: product.barcode || product.sku || '',
      category_id: product.category_id || null, // Don't force category_id
      unit_price: parseFloat(product.price) || 0,
      purchase_price: parseFloat(product.purchase_price) || parseFloat(product.price) || 0,
      quantity_on_hand: parseInt(product.quantity) || 0,
      minimum_quantity: parseInt(product.minimum_quantity) || 10,
      is_taxable: product.is_taxable !== false, // Default to true
      tax_percentage: parseFloat(product.tax_percentage) || 19,
      is_active: true,
    }

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()

    if (error) {
      // Create operation failed
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data[0] }
  } catch (err) {
    // Insert failed
    return { ok: false, error: err.message }
  }
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

  try {
    const updateData = {
      name: updates.name,
      description: updates.description || '',
      sku: updates.sku || '', // Keep existing SKU if not provided
      barcode: updates.barcode || updates.sku || '',
      category_id: updates.category_id || null, // Don't force category_id
      unit_price: parseFloat(updates.price) || 0,
      purchase_price: parseFloat(updates.purchase_price) || parseFloat(updates.price) || 0,
      quantity_on_hand: parseInt(updates.quantity) || 0,
      minimum_quantity: parseInt(updates.minimum_quantity) || 10,
      is_taxable: updates.is_taxable !== false,
      tax_percentage: parseFloat(updates.tax_percentage) || 19,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      // Update failed
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data[0] }
  } catch (err) {
    // Exception occurred
    return { ok: false, error: err.message }
  }
}

/**
 * Delete a product (soft delete - marks as inactive)
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

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
