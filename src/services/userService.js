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
      // Demo mode or unauthenticated session
      return true
    }

    // Call the SECURITY DEFINER function to safely create user
    const { data, error } = await supabase
      .rpc('ensure_user_exists')

    if (error) {
      console.warn('Warning ensuring user exists:', error.message)
      return true
    }

    return true
  } catch (err) {
    console.warn('ensureUserExists exception:', err)
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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching current user:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('getCurrentUser exception:', err)
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
      console.warn('RPC warning:', rpcError.message)
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
