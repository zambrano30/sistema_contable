import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { getActiveCompanyId } from './companyService'

/**
 * Log an expense action for audit
 */
export async function logExpenseAudit(expenseId, action, oldValues = null, newValues = null, notes = null) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('expense_audit_log')
      .insert([{
        expense_id: expenseId,
        action,
        old_values: oldValues,
        new_values: newValues,
        user_id: user.data.user?.id,
        notes
      }])
      .select()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data[0] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get audit logs for an expense
 */
export async function getExpenseAuditLog(expenseId) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { data, error } = await supabase
      .from('expense_audit_log')
      .select(`
        *,
        user:user_id(email, raw_user_meta_data)
      `)
      .eq('expense_id', expenseId)
      .order('created_at', { ascending: false })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get audit logs for a company (company-wide audit)
 */
export async function getCompanyAuditLog(limit = 100, offset = 0) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const companyId = getActiveCompanyId()
    if (!companyId) return { ok: false, error: 'No company selected' }

    const { data, error, count } = await supabase
      .from('expense_audit_log')
      .select(`
        *,
        expense:expense_id(item_name, category, amount),
        user:user_id(email)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [], total: count }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get recent audit activity
 */
export async function getRecentAuditActivity(days = 7) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('expense_audit_log')
      .select(`
        *,
        user:user_id(email)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get audit summary statistics
 */
export async function getAuditSummary(days = 30) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('expense_audit_log')
      .select('action')
      .gte('created_at', startDate.toISOString())

    if (error) return { ok: false, error: error.message }

    const summary = {
      total: data?.length || 0,
      creates: data?.filter(d => d.action === 'create').length || 0,
      updates: data?.filter(d => d.action === 'update').length || 0,
      deletes: data?.filter(d => d.action === 'delete').length || 0,
      approvals: data?.filter(d => d.action === 'approve').length || 0,
      rejections: data?.filter(d => d.action === 'reject').length || 0
    }

    return { ok: true, data: summary }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
