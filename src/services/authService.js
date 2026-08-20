import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Sign up a new user
 * @param {string} email - User email or username
 * @param {string} password - User password
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function signUp(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  try {
    // Convert username to email format if needed
    const emailToUse = email.includes('@') ? email : `${email}@facturapro.local`
    
    const { data, error } = await supabase.auth.signUp({
      email: emailToUse,
      password,
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (err) {
    console.error('signUp exception:', err)
    return { ok: false, error: 'No se pudo conectar con el servidor de Supabase (posiblemente pausado o inalcanzable).' }
  }
}

/**
 * Sign in user with email and password
 * @param {string} email - User email or username
 * @param {string} password - User password
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  try {
    // Convert username to email format if needed
    const emailToUse = email.includes('@') ? email : `${email}@facturapro.local`
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (err) {
    console.error('signIn exception:', err)
    return { ok: false, error: 'No se pudo conectar con el servidor de Supabase (posiblemente pausado o inalcanzable).' }
  }
}

/**
 * Sign out current user
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    console.error('signOut exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Get current session
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (err) {
    console.error('getSession exception:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {}
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session)
  })

  return () => {
    data?.subscription?.unsubscribe()
  }
}
