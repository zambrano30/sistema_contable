import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserExists } from './userService'

/**
 * Get all expenses with optional filters
 */
export async function getAllExpenses(filters = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('is_active', true)
      .order('expense_date', { ascending: false })

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.startDate) {
      query = query.gte('expense_date', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('expense_date', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
      // Database query failed
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    // Exception occurred during query
    return { ok: false, error: err.message }
  }
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(category) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('expense_date', { ascending: false })

    if (error) {
      // Database query failed
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    // Exception occurred during query
    return { ok: false, error: err.message }
  }
}

/**
 * Calculate cost for a product (pasteles, jugos, etc)
 */
export async function calculateProductCost(productName) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('item_name', productName)
      .eq('is_active', true)

    if (error) {
      // Calculation failed
      return { ok: false, error: error.message }
    }

    const totalCost = (data || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)
    return { ok: true, data: totalCost }
  } catch (err) {
    // Calculation error
    return { ok: false, error: err.message }
  }
}

/**
 * Get total expenses by category
 */
export async function getTotalExpensesByCategory(category, startDate = null, endDate = null) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    let query = supabase
      .from('expenses')
      .select('amount')
      .eq('category', category)
      .eq('is_active', true)

    if (startDate) query = query.gte('expense_date', startDate)
    if (endDate) query = query.lte('expense_date', endDate)

    const { data, error } = await query

    if (error) {
      // Aggregation query failed
      return { ok: false, error: error.message }
    }

    const total = (data || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)
    return { ok: true, data: total }
  } catch (err) {
    // Aggregation error
    return { ok: false, error: err.message }
  }
}

/**
 * Create a new expense
 */
export async function createExpense(expenseData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    // Ensure user exists
    const userExists = await ensureUserExists()
    if (!userExists) {
      return { ok: false, error: 'Could not verify user in database' }
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          category: expenseData.category,
          item_name: expenseData.item_name,
          description: expenseData.description || '',
          quantity: expenseData.quantity || 1,
          unit_price: expenseData.unit_price || 0,
          amount: expenseData.amount || 0,
          expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
          notes: expenseData.notes || '',
          is_active: true,
        }
      ])
      .select('*')

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
 * Update an expense
 */
export async function updateExpense(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
 * Delete (soft delete) an expense
 */
export async function deleteExpense(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { error } = await supabase
      .from('expenses')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      // Delete operation failed
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    // Exception occurred
    return { ok: false, error: err.message }
  }
}
