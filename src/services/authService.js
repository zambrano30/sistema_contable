import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Sign up a new user
 * @param {string} email - User email
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
}

/**
 * Sign in user with email and password
 * @param {string} email - User email
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
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

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
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

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data }
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
