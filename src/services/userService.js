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
