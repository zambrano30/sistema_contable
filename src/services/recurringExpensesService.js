import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getActiveCompanyId } from './companyService'

/**
 * Get all recurring expenses for the company
 */
export async function getRecurringExpenses() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    if (!companyId) return { ok: false, error: 'No company selected' }

    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('next_due_date', { ascending: true })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Create a new recurring expense
 */
export async function createRecurringExpense(expenseData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert([{
        ...expenseData,
        company_id: companyId,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data[0] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Update recurring expense
 */
export async function updateRecurringExpense(id, expenseData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update({ ...expenseData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data[0] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Deactivate recurring expense (soft delete)
 */
export async function deactivateRecurringExpense(id) {
  return updateRecurringExpense(id, { is_active: false })
}

/**
 * Process due recurring expenses
 */
export async function processDueRecurringExpenses() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    
    // Get due expenses
    const { data: dueExpenses, error: fetchError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .lte('next_due_date', new Date().toISOString().split('T')[0])

    if (fetchError) return { ok: false, error: fetchError.message }

    const createdExpenses = []
    
    for (const recurring of dueExpenses) {
      // Create expense from recurring
      const result = await supabase
        .from('expenses')
        .insert([{
          company_id: companyId,
          provider_id: recurring.provider_id,
          category: recurring.category,
          item_name: recurring.item_name,
          description: recurring.description,
          quantity: 1,
          unit_price: recurring.amount,
          amount: recurring.amount,
          expense_date: new Date().toISOString().split('T')[0],
          notes: `Gasto recurrente automático - ${recurring.item_name}`,
          is_active: true
        }])
        .select()

      if (result.data) {
        createdExpenses.push(result.data[0])

        // Update next due date
        const nextDueDate = calculateNextDueDate(recurring.frequency, recurring.day_of_month)
        await updateRecurringExpense(recurring.id, { next_due_date: nextDueDate })
      }
    }

    return { ok: true, data: createdExpenses }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Calculate next due date based on frequency
 */
function calculateNextDueDate(frequency, dayOfMonth = null) {
  const today = new Date()
  let nextDate = new Date(today)

  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      if (dayOfMonth) {
        nextDate.setDate(dayOfMonth)
      }
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default:
      nextDate.setDate(nextDate.getDate() + 7)
  }

  return nextDate.toISOString().split('T')[0]
}
