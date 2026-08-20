import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserExists } from './userService'

/**
 * Get all inventory movements
 */
export async function getAllInventoryMovements(filters = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.productId) {
      query = query.eq('product_id', filters.productId)
    }

    if (filters.type) {
      query = query.eq('movement_type', filters.type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get inventory movements error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    console.error('Get inventory movements exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Record an inventory movement
 */
export async function createInventoryMovement(movementData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    // Ensure user exists
    const userExists = await ensureUserExists()
    if (!userExists) {
      return { ok: false, error: 'Could not verify user in database' }
    }

    // First, get current inventory
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('quantity_on_hand')
      .eq('id', movementData.product_id)
      .single()

    if (productError) {
      return { ok: false, error: 'Product not found' }
    }

    // Record the movement
    const { data: movementResult, error: movementError } = await supabase
      .from('inventory_movements')
      .insert([
        {
          product_id: movementData.product_id,
          movement_type: movementData.movement_type, // IN, OUT, ADJUSTMENT, RETURN
          quantity: movementData.quantity,
          reference_type: movementData.reference_type || null,
          reference_id: movementData.reference_id || null,
          notes: movementData.notes || '',
        }
      ])
      .select()

    if (movementError) {
      console.error('Create inventory movement error:', movementError)
      return { ok: false, error: movementError.message }
    }

    // Update product quantity based on movement type
    let newQuantity = product.quantity_on_hand
    
    if (movementData.movement_type === 'IN') {
      newQuantity += movementData.quantity
    } else if (movementData.movement_type === 'OUT') {
      newQuantity -= movementData.quantity
    } else if (movementData.movement_type === 'RETURN') {
      newQuantity += movementData.quantity
    }
    // ADJUSTMENT: directly set

    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity_on_hand: Math.max(0, newQuantity) })
      .eq('id', movementData.product_id)

    if (updateError) {
      console.error('Update product quantity error:', updateError)
      // Movement recorded but quantity not updated - this is a partial failure
    }

    return { ok: true, data: movementResult[0] }
  } catch (err) {
    console.error('Create inventory movement exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('quantity_on_hand', supabase.raw('minimum_quantity'))
      .eq('is_active', true)
      .order('quantity_on_hand', { ascending: true })

    if (error) {
      console.error('Get low stock products error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    console.error('Get low stock products exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Get inventory summary
 */
export async function getInventorySummary() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('quantity_on_hand, unit_price, minimum_quantity')
      .eq('is_active', true)

    if (error) {
      console.error('Get inventory summary error:', error)
      return { ok: false, error: error.message }
    }

    const totalItems = data?.reduce((sum, p) => sum + (p.quantity_on_hand || 0), 0) || 0
    const totalValue = data?.reduce((sum, p) => sum + ((p.quantity_on_hand || 0) * (p.unit_price || 0)), 0) || 0
    const lowStockCount = data?.filter(p => p.quantity_on_hand < p.minimum_quantity).length || 0

    return {
      ok: true,
      data: {
        totalItems,
        totalValue,
        lowStockCount,
        productCount: data?.length || 0,
      },
    }
  } catch (err) {
    console.error('Get inventory summary exception:', err)
    return { ok: false, error: err.message }
  }
}
