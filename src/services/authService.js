import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

// Validar cédula (6-20 números)
export function validateCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') return false
  const cleaned = cedula.trim()
  return /^\d{6,20}$/.test(cleaned)
}

// Validar contraseña (mínimo 6 caracteres)
export function validatePassword(password) {
  return password && password.length >= 6
}

// Sanitizar input (prevenir XSS)
export function sanitizeInput(input) {
  if (!input) return ''
  return String(input)
    .trim()
    .replace(/[<>\"']/g, '') // Quitar caracteres peligrosos
    .substring(0, 255) // Limitar longitud
}

/**
 * Sign up a new user with cedula and full details
 * @param {Object} userData - {cedula, password, nombre, email, telefono, empresa_nombre, cargo}
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function signUp(userData) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  // Validar cédula
  if (!validateCedula(userData.cedula)) {
    return { ok: false, error: 'Cédula inválida. Debe tener entre 6 y 20 números.' }
  }

  // Validar contraseña
  if (!validatePassword(userData.password)) {
    return { ok: false, error: 'La contraseña debe tener mínimo 6 caracteres.' }
  }

  // Validar nombre
  const nombre = sanitizeInput(userData.nombre)
  if (!nombre || nombre.length < 2) {
    return { ok: false, error: 'El nombre debe tener mínimo 2 caracteres.' }
  }

  // Validar email
  const email = sanitizeInput(userData.email)
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Email inválido.' }
  }

  try {
    // Paso 1: Crear en Supabase Auth CON metadata
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: userData.password,
      options: {
        data: {
          cedula: userData.cedula.trim(),
          nombre: nombre,
          telefono: sanitizeInput(userData.telefono || '') || '',
          empresa_nombre: sanitizeInput(userData.empresa_nombre || '') || '',
          cargo: sanitizeInput(userData.cargo || '') || ''
        }
      }
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    if (!data?.user?.id) {
      return { ok: false, error: 'No se pudo crear la cuenta' }
    }

    // Paso 2: Insertar en tabla users DIRECTAMENTE (NO depender del trigger)
    // Esperar un poco para que se cree el usuario en auth
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        cedula: userData.cedula.trim(),
        nombre: nombre,
        email: email,
        telefono: sanitizeInput(userData.telefono || '') || null,
        empresa_nombre: sanitizeInput(userData.empresa_nombre || '') || null,
        cargo: sanitizeInput(userData.cargo || '') || null,
        rol: 'Vendedor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (userInsertError) {
      console.warn('Warning al guardar usuario:', userInsertError.message)
      // No fallar - el usuario se registró en auth exitosamente
    } else {
      console.log('✅ Usuario guardado en tabla users:', userData.cedula)
    }

    return { ok: true, data }
  } catch (err) {
    console.error('SignUp error:', err)
    return { ok: false, error: 'Error al registrarse: ' + err.message }
  }
}

/**
 * Sign in user with cedula and password
 * @param {string} cedula - User cedula (ID number)
 * @param {string} password - User password
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
export async function signIn(cedula, password) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Missing Supabase environment variables.',
    }
  }

  // Validar cédula
  if (!validateCedula(cedula)) {
    return { ok: false, error: 'Cédula inválida. Debe tener entre 6 y 20 números.' }
  }

  // Validar contraseña
  if (!password || password.length === 0) {
    return { ok: false, error: 'La contraseña es requerida.' }
  }

  try {
    const cedulaLimpita = cedula.trim()

    // Intentar buscar el usuario por cedula
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, id, cedula')
      .eq('cedula', cedulaLimpita)
      .maybeSingle()

    // Si no encuentra por cédula exacta, intenta sin espacios o variaciones
    if (!userData && userError?.code === 'PGRST116') {
      // Intenta búsqueda más flexible (sin espacios)
      const cedulaSinEspacios = cedulaLimpita.replace(/\s/g, '')
      const { data: result2 } = await supabase
        .from('users')
        .select('email, id, cedula')
        .ilike('cedula', `%${cedulaSinEspacios}%`)
        .maybeSingle()
      
      userData = result2
    }

    if (!userData?.email) {
      console.error('Usuario no encontrado con cédula:', cedulaLimpita)
      return { 
        ok: false, 
        error: 'Usuario no encontrado. Verifica tu cédula o regístrate.' 
      }
    }

    console.log('Usuario encontrado:', userData.id, userData.cedula)

    // Usar el email real del usuario para autenticarse
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    })

    if (error) {
      console.error('Auth error:', error.message)
      return { ok: false, error: error.message || 'Contraseña incorrecta.' }
    }

    return { ok: true, data }
  } catch (err) {
    console.error('SignIn error:', err)
    return { ok: false, error: 'No se pudo conectar con el servidor. Intenta más tarde.' }
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
    // Handle sign out errors silently
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
    // Handle session retrieval errors silently
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

/**
 * Change password for current user
 * @param {string} newPassword - New password
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function changePassword(newPassword) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  if (!validatePassword(newPassword)) {
    return { ok: false, error: 'La contraseña debe tener mínimo 6 caracteres.' }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'No se pudo cambiar la contraseña.' }
  }
}

/**
 * Request password reset email
 * @param {string} cedula - User cedula
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function resetPasswordRequest(cedula) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  if (!validateCedula(cedula)) {
    return { ok: false, error: 'Cédula inválida.' }
  }

  try {
    // Buscar el email real del usuario por cedula
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('cedula', cedula)
      .single()

    if (userError || !userData?.email) {
      return { ok: false, error: 'Usuario no encontrado. Verifica tu cédula.' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'No se pudo enviar el email de recuperación.' }
  }
}

/**
 * Confirm password reset with token
 * @param {string} newPassword - New password
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function confirmPasswordReset(newPassword) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase environment variables.' }
  }

  if (!validatePassword(newPassword)) {
    return { ok: false, error: 'La contraseña debe tener mínimo 6 caracteres.' }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'No se pudo confirmar la contraseña.' }
  }
}
