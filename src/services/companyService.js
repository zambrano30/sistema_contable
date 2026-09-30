import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const ACTIVE_COMPANY_KEY = 'facturapro_active_company_id'

export function getActiveCompanyId() {
  try {
    return localStorage.getItem(ACTIVE_COMPANY_KEY)
  } catch {
    return null
  }
}

export function saveActiveCompanyId(companyId) {
  try {
    if (companyId) localStorage.setItem(ACTIVE_COMPANY_KEY, companyId)
    else localStorage.removeItem(ACTIVE_COMPANY_KEY)
  } catch {
    return false
  }
  return true
}

export async function getCompanyMemberships(userId) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase no está configurado' }
  }

  const { data, error } = await supabase
    .from('company_memberships')
    .select('company_id, role, company:companies(id, name, legal_name, tax_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    data: (data || []).map(({ company, role }) => ({ ...company, role })),
  }
}

export async function createCompanyRecord({ name, legalName = '', taxId = '' }) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase no está configurado' }
  }

  const { data, error } = await supabase.rpc('create_company', {
    p_name: name,
    p_legal_name: legalName || null,
    p_tax_id: taxId || null,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

export async function addCompanyMember(companyId, userId, role) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase no está configurado' }
  }

  const { error } = await supabase.rpc('add_company_member', {
    p_company_id: companyId,
    p_user_id: userId,
    p_role: role,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}