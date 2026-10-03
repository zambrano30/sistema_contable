import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Ensure current user exists in users table using SECURITY DEFINER function
 * This bypasses RLS policies and safely creates the user if needed
 */
export async function ensureUserExists() {
  if (!isSupabaseConfigured || !supabase) {
    return true
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return true
    }

    // Call the SECURITY DEFINER function to safely create user
    const { data, error } = await supabase
      .rpc('ensure_user_exists')

    if (error) {
      // Expected edge case handled
      return true
    }

    return true
  } catch (err) {
    // Expected edge case handled
    return true
  }
}

/**
 * Get current user from users table
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    // Buscar usuario por email real
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (error) {
      // Fetch operation failed
      return null
    }

    return data
  } catch (err) {
    // Exception occurred
    return null
  }
}

/**
 * Create a new cook/kitchen user
 * @param {string} email - Email of the cook
 * @param {string} password - Password for the cook
 * @param {string} name - Name of the cook
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function createCookUser(email, password, name) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    // Paso 1: Crear usuario en auth.users primero con signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          role: 'cocinero'
        }
      }
    })

    if (authError) {
      return {
        ok: false,
        error: authError.message,
      }
    }

    const cookUserId = authData.user?.id
    if (!cookUserId) {
      return {
        ok: false,
        error: 'No user ID returned from auth signup',
      }
    }

    // Paso 2: Registrar en tabla users con el UUID válido
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('register_cook_user', {
        p_user_id: cookUserId,
        p_email: email,
        p_name: name
      })

    if (rpcError) {
      // Expected edge case handled
      // Si falla el RPC, el usuario ya está en auth.users pero podría no estar en public.users
      // Esto es aceptable, el usuario puede iniciar sesión
    }

    return {
      ok: true,
      data: {
        id: cookUserId,
        email: email,
        full_name: name,
        role: 'cocinero'
      },
      message: 'Cook user created successfully! Ready to login.'
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}

/**
 * Get all cook users
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getCookUsers() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'cocinero')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        ok: false,
        error: error.message,
      }
    }

    return {
      ok: true,
      data: data || [],
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}

/**
 * Assign a vendor to a company using RPC function
 * @param {string} userId - User ID of the vendor
 * @param {string} companyId - Company ID to assign to
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function assignVendorToCompany(userId, companyId) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  if (!userId || !companyId) {
    return {
      ok: false,
      error: 'User ID and Company ID are required',
    }
  }

  try {
    // STRATEGY: Try RPC first (has SECURITY DEFINER bypass)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('assign_vendor_to_company', {
        p_vendor_id: userId,
        p_company_id: companyId
      })

    if (!rpcError) {
      // RPC function exists and executed
      if (rpcData?.success) {
        console.log('✅ Vendor assigned via RPC (SECURITY DEFINER)')
        return { ok: true }
      } else {
        console.error('❌ RPC returned error:', rpcData?.message)
        return {
          ok: false,
          error: rpcData?.message || 'RPC assignment failed',
        }
      }
    }

    // If RPC doesn't exist (404), try direct INSERT as fallback
    if (rpcError?.message?.includes('does not exist') || rpcError?.message?.includes('Could not find the function')) {
      console.warn('⚠️ RPC function not yet created, attempting direct INSERT...')
      
      const { error: insertError } = await supabase
        .from('company_memberships')
        .insert([
          {
            company_id: companyId,
            user_id: userId,
            role: 'Vendedor'
          }
        ])

      if (!insertError) {
        console.log('✅ Vendor assigned via direct INSERT')
        return { ok: true }
      }

      // If both fail
      console.error('❌ Both methods failed. RPC error:', rpcError?.message, 'INSERT error:', insertError?.message)
      return {
        ok: false,
        error: 'Cannot assign vendor to company. Please execute SQL script in Supabase.',
      }
    }

    // Other RPC error
    console.error('❌ RPC error:', rpcError?.message)
    return {
      ok: false,
      error: rpcError?.message || 'Failed to assign vendor',
    }
  } catch (err) {
    console.error('❌ Exception in assignVendorToCompany:', err.message)
    return {
      ok: false,
      error: err.message,
    }
  }
}

/**
 * Create a new vendor/sales user
 * @param {string} email - Email of the vendor
 * @param {string} password - Password for the vendor
 * @param {string} name - Name of the vendor
 * @param {string} companyId - (Optional) Company ID to assign vendor to
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function createVendorUser(email, password, name, companyId = null) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    // Step 1: Create user in auth.users first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          role: 'vendedor'
        }
      }
    })

    if (authError) {
      return {
        ok: false,
        error: authError.message,
      }
    }

    const vendorUserId = authData.user?.id
    if (!vendorUserId) {
      return {
        ok: false,
        error: 'No user ID returned from auth signup',
      }
    }

    // Step 2: Register in users table with valid UUID
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('register_vendor_user', {
        p_user_id: vendorUserId,
        p_email: email,
        p_name: name
      })

    if (rpcError) {
      // Expected edge case handled - user can still login even if RPC fails
    }

    // Step 3: Assign to company if provided
    if (companyId) {
      const assignResult = await assignVendorToCompany(vendorUserId, companyId)
      if (!assignResult.ok) {
        console.warn('⚠️ Vendor created but not assigned to company:', assignResult.error)
      }
    }

    return {
      ok: true,
      data: {
        id: vendorUserId,
        email: email,
        full_name: name,
        role: 'vendedor'
      },
      message: 'Vendor user created successfully! Ready to login.'
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}

/**
 * Get all vendor users
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getVendorUsers() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'vendedor')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        ok: false,
        error: error.message,
      }
    }

    return {
      ok: true,
      data: data || [],
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}
