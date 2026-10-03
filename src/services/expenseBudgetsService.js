import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getActiveCompanyId } from './companyService'

/**
 * Get all expense budgets for the company
 */
export async function getExpenseBudgets() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    if (!companyId) return { ok: false, error: 'No company selected' }

    const { data, error } = await supabase
      .from('expense_budgets')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('start_date', { ascending: false })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Create a new expense budget
 */
export async function createExpenseBudget(budgetData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    const { data, error } = await supabase
      .from('expense_budgets')
      .insert([{
        ...budgetData,
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
 * Update expense budget
 */
export async function updateExpenseBudget(id, budgetData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { data, error } = await supabase
      .from('expense_budgets')
      .update({ ...budgetData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data[0] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Delete budget
 */
export async function deleteExpenseBudget(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { error } = await supabase
      .from('expense_budgets')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get budget analysis for a specific category and period
 */
export async function getBudgetAnalysis(category, startDate, endDate) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    
    // Get budget
    const { data: budgetData, error: budgetError } = await supabase
      .from('expense_budgets')
      .select('*')
      .eq('company_id', companyId)
      .eq('category', category)
      .eq('is_active', true)
      .single()

    // Get actual expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('company_id', companyId)
      .eq('category', category)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .eq('is_active', true)

    if (budgetError && budgetError.code !== 'PGRST116') {
      return { ok: false, error: budgetError.message }
    }

    const totalSpent = expensesData?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0
    const budgetAmount = budgetData?.budget_amount || 0
    const remaining = budgetAmount - totalSpent
    const percentageUsed = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0
    const isAlert = percentageUsed >= (budgetData?.alert_threshold || 80)

    return {
      ok: true,
      data: {
        budget: budgetData,
        totalSpent,
        budgetAmount,
        remaining,
        percentageUsed,
        isAlert,
        transactionCount: expensesData?.length || 0
      }
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get budget alerts
 */
export async function getBudgetAlerts() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    const today = new Date().toISOString().split('T')[0]

    const { data: budgets, error } = await supabase
      .from('expense_budgets')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)

    if (error) return { ok: false, error: error.message }

    const alerts = []

    for (const budget of budgets || []) {
      const analysis = await getBudgetAnalysis(budget.category, budget.start_date, budget.end_date)
      if (analysis.ok && analysis.data.isAlert) {
        alerts.push({
          budget,
          ...analysis.data
        })
      }
    }

    return { ok: true, data: alerts }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
