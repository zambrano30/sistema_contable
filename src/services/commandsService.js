import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * Create a new command in Supabase
 * @param {Object} commandData - Command data
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function createCommand(commandData) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        ok: false,
        error: 'Usuario no autenticado',
      }
    }

    const { data, error } = await supabase
      .from('commands')
      .insert({
        ...commandData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return {
        ok: false,
        error: error.message,
      }
    }

    return {
      ok: true,
      data: data?.[0],
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}

/**
 * Get all commands for the current user
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getCommands() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const { data, error } = await supabase
      .from('commands')
      .select('*')
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
 * Get commands by status
 * @param {string} status - Status filter
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getCommandsByStatus(status) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const { data, error } = await supabase
      .from('commands')
      .select('*')
      .eq('status', status)
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
 * Update command status
 * @param {number} commandId - Command ID
 * @param {string} newStatus - New status
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function updateCommandStatus(commandId, newStatus) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered']
    
    if (!validStatuses.includes(newStatus)) {
      return {
        ok: false,
        error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`,
      }
    }

    const { data, error } = await supabase
      .from('commands')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commandId)
      .select()

    if (error) {
      return {
        ok: false,
        error: error.message,
      }
    }

    return {
      ok: true,
      data: data?.[0],
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}

/**
 * Delete a command
 * @param {number} commandId - Command ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteCommand(commandId) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase no está configurado',
    }
  }

  try {
    const { error } = await supabase
      .from('commands')
      .delete()
      .eq('id', commandId)

    if (error) {
      return {
        ok: false,
        error: error.message,
      }
    }

    return {
      ok: true,
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    }
  }
}
