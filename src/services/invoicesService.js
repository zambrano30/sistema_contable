import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserExists } from './userService'

/**
 * Fetch all invoices with optional filters
 */
export async function getAllInvoices(filters = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get invoices error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err) {
    console.error('Get invoices exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Get total sales amount
 * @param {string} period - 'month', 'quarter', 'year' or specific date range
 * @returns {Promise<{ok: boolean, data?: {total: number, count: number, monthlyGrowth: number}, error?: string}>}
 */
export async function getTotalSales(period = 'month') {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const now = new Date()
  let startDate, previousStartDate

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3)
    startDate = new Date(now.getFullYear(), quarter * 3, 1)
    previousStartDate = new Date(now.getFullYear(), quarter * 3 - 3, 1)
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1)
    previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
  }

  // Current period total
  const { data: currentData, error: currentError } = await supabase
    .from('invoices')
    .select('total_amount')
    .gte('invoice_date', startDate.toISOString().split('T')[0])
    .in('status', ['sent', 'paid'])

  // Previous period total
  const endPreviousPeriod = new Date(startDate)
  endPreviousPeriod.setDate(endPreviousPeriod.getDate() - 1)

  const { data: previousData, error: previousError } = await supabase
    .from('invoices')
    .select('total_amount')
    .gte('invoice_date', previousStartDate.toISOString().split('T')[0])
    .lte('invoice_date', endPreviousPeriod.toISOString().split('T')[0])
    .in('status', ['sent', 'paid'])

  if (currentError || previousError) {
    return { ok: false, error: currentError?.message || previousError?.message }
  }

  const currentTotal = currentData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
  const previousTotal = previousData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  const monthlyGrowth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  return {
    ok: true,
    data: {
      total: currentTotal,
      count: currentData?.length || 0,
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(1)),
    },
  }
}

/**
 * Get monthly sales data for chart
 * @param {number} months - Number of months to include
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getMonthlySalesData(months = 12) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_date, total_amount')
    .in('status', ['sent', 'paid'])
    .order('invoice_date', { ascending: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  // Group by month
  const monthlyData = {}
  const now = new Date()

  // Initialize last N months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toISOString().split('T')[0].substring(0, 7) // YYYY-MM
    monthlyData[key] = 0
  }

  // Aggregate sales by month
  data?.forEach((invoice) => {
    const key = invoice.invoice_date.substring(0, 7)
    if (key in monthlyData) {
      monthlyData[key] += invoice.total_amount || 0
    }
  })

  return {
    ok: true,
    data: Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total: parseFloat(total.toFixed(2)),
    })),
  }
}

/**
 * Get invoice statistics
 * @returns {Promise<{ok: boolean, data?: {total: number, draft: number, sent: number, paid: number, cancelled: number}, error?: string}>}
 */
export async function getInvoiceStats() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase.from('invoices').select('status')

  if (error) {
    return { ok: false, error: error.message }
  }

  const stats = {
    total: data?.length || 0,
    draft: data?.filter((inv) => inv.status === 'draft').length || 0,
    sent: data?.filter((inv) => inv.status === 'sent').length || 0,
    paid: data?.filter((inv) => inv.status === 'paid').length || 0,
    cancelled: data?.filter((inv) => inv.status === 'cancelled').length || 0,
  }

  return { ok: true, data: stats }
}

/**
 * Get a single invoice by ID
 * @param {number} id - Invoice ID
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function getInvoiceById(id) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients(*),
      invoice_items(*, products(*))
    `)
    .eq('id', id)
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
}

/**
 * Create a new invoice with items
 */
export async function createInvoice(invoiceData) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  try {
    // Ensure user exists
    const userExists = await ensureUserExists()
    if (!userExists) {
      return { ok: false, error: 'Could not verify user in database' }
    }

    const { items, ...invoice } = invoiceData

    // Create invoice
    const { data: invoiceResult, error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          client_id: invoice.client_id,
          invoice_date: invoice.invoice_date || new Date().toISOString(),
          due_date: invoice.due_date,
          status: 'draft',
          subtotal: invoice.subtotal || 0,
          tax_amount: invoice.tax_amount || 0,
          discount_amount: invoice.discount_amount || 0,
          total_amount: invoice.total_amount || 0,
          notes: invoice.notes || '',
        }
      ])
      .select()

    if (invoiceError) {
      console.error('Create invoice error:', invoiceError)
      return { ok: false, error: invoiceError.message }
    }

    const newInvoice = invoiceResult[0]

    // Create invoice items if provided
    if (items && items.length > 0) {
      const itemsData = items.map(item => ({
        invoice_id: newInvoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        tax_percentage: item.tax_percentage || 19,
        line_total: item.line_total,
        description: item.description || '',
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData)

      if (itemsError) {
        console.error('Create invoice items error:', itemsError)
        return { ok: false, error: itemsError.message }
      }
    }

    return { ok: true, data: newInvoice }
  } catch (err) {
    console.error('Create invoice exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Update an invoice
 * @param {number} id - Invoice ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function updateInvoice(id, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data[0] }
}

/**
 * Update invoice status
 * @param {number} id - Invoice ID
 * @param {string} status - New status
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function updateInvoiceStatus(id, status) {
  return updateInvoice(id, { status })
}

/**
 * Delete an invoice
 * @param {number} id - Invoice ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteInvoice(id) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  const { error } = await supabase.from('invoices').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
