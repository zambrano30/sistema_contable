import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserExists } from './userService'

/**
 * Get all payments with optional filters
 */
export async function getAllPayments(filters = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    let query = supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false })

    if (filters.invoiceId) {
      query = query.eq('invoice_id', filters.invoiceId)
    }

    if (filters.method) {
      query = query.eq('payment_method', filters.method)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get payments error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    console.error('Get payments exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Record a payment
 */
export async function createPayment(paymentData) {
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
      .from('payments')
      .insert([
        {
          invoice_id: paymentData.invoice_id,
          payment_date: paymentData.payment_date || new Date().toISOString(),
          payment_method: paymentData.payment_method || 'cash',
          amount: parseFloat(paymentData.amount) || 0,
          reference_number: paymentData.reference_number || '',
          notes: paymentData.notes || '',
        }
      ])
      .select()

    if (error) {
      console.error('Create payment error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data[0] }
  } catch (err) {
    console.error('Create payment exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Get payment statistics
 */
export async function getPaymentStats() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')

    if (error) {
      console.error('Get payment stats error:', error)
      return { ok: false, error: error.message }
    }

    const totalCollected = data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    return {
      ok: true,
      data: {
        totalCollected,
        paymentCount: data?.length || 0,
        averagePayment: data && data.length > 0 ? totalCollected / data.length : 0,
      },
    }
  } catch (err) {
    console.error('Get payment stats exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Get pending payments (unpaid invoices)
 */
export async function getPendingPayments() {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['draft', 'sent'])
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Get pending payments error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    console.error('Get pending payments exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete payment error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    console.error('Delete payment exception:', err)
    return { ok: false, error: err.message }
  }
}
