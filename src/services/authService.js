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
    console.log('📝 Iniciando signup para:', email)
    console.log('Cédula:', userData.cedula.trim())
    
    // PASO 1: Crear en Supabase Auth
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
      console.error('❌ Error en auth.signUp:', error)
      return { ok: false, error: error.message }
    }

    if (!data?.user?.id) {
      console.error('❌ No user ID returned')
      return { ok: false, error: 'No se pudo crear la cuenta' }
    }

    console.log('✅ Usuario creado en auth:', data.user.id)

    // PASO 2: Insertar en tabla users DIRECTAMENTE
    // Esperar a que el usuario exista en auth
    let attempts = 0
    let userExists = false
    
    while (attempts < 5 && !userExists) {
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
      
      try {
        // Verificar que el usuario existe
        const { data: checkUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()
        
        if (checkUser) {
          userExists = true
          console.log('✅ Usuario ya existe en tabla users (trigger funcionó)')
          // Actualizar con la cédula correcta si no la tiene
          if (!checkUser.cedula || checkUser.cedula.startsWith('TEMP-')) {
            console.log('🔄 Actualizando cédula en usuario existente...')
            await supabase
              .from('users')
              .update({ cedula: userData.cedula.trim() })
              .eq('id', data.user.id)
          }
          break
        }
      } catch (e) {
        console.log('⏳ Usuario aún no existe, reintentando... Intento', attempts)
      }
    }

    // Si el usuario NO existe aún, insertarlo directamente
    if (!userExists) {
      console.log('🔧 Insertando usuario directamente...')
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          cedula: userData.cedula.trim(),
          nombre: nombre,
          email: email,
          telefono: sanitizeInput(userData.telefono || '') || null,
          empresa_nombre: sanitizeInput(userData.empresa_nombre || '') || null,
          cargo: sanitizeInput(userData.cargo || '') || null,
          rol: 'Vendedor',
          is_active: true
        })

      if (insertError) {
        console.error('⚠️ Error al insertar usuario:', insertError.message)
        // No fallar - el usuario se registró en auth
      } else {
        console.log('✅ Usuario insertado con cédula:', userData.cedula.trim())
      }
    }

    // PASO 3: Verificar que la cédula se guardó correctamente
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: finalCheck } = await supabase
      .from('users')
      .select('cedula, nombre, email')
      .eq('id', data.user.id)
      .maybeSingle()

    if (finalCheck) {
      console.log('✅ Verificación final - Usuario guardado:', finalCheck)
      if (finalCheck.cedula !== userData.cedula.trim()) {
        console.warn('⚠️ Cédula no coincide! Esperada:', userData.cedula.trim(), 'Actual:', finalCheck.cedula)
      }
    }

    return { ok: true, data }
  } catch (err) {
    console.error('❌ SignUp error:', err)
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
    const cedulaTrim = cedula.trim()
    console.log('🔍 Buscando usuario con cédula:', cedulaTrim)

    // PASO 1: Buscar el usuario por cedula
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, cedula, nombre')
      .eq('cedula', cedulaTrim)
      .maybeSingle()

    // Si no encuentra exacto, intenta búsqueda más flexible
    if (!userData) {
      console.log('⚠️ No encontrado exacto. Intentando búsqueda flexible...')
      const { data: flexibleResult } = await supabase
        .from('users')
        .select('id, email, cedula, nombre')
        .ilike('cedula', `%${cedulaTrim}%`)
        .maybeSingle()
      
      userData = flexibleResult
    }

    if (!userData?.email) {
      console.error('❌ Usuario no encontrado con cédula:', cedulaTrim)
      console.log('💡 Consulta la base de datos para verificar las cédulas disponibles')
      return { 
        ok: false, 
        error: 'Usuario no encontrado. Verifica tu cédula o regístrate primero.' 
      }
    }

    console.log('✅ Usuario encontrado:', userData.nombre, '-', userData.email)

    // PASO 2: Usar el email del usuario para autenticarse
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password,
    })

    if (authError) {
      console.error('❌ Error de autenticación:', authError.message)
      return { ok: false, error: 'Contraseña incorrecta.' }
    }

    if (!authData?.user) {
      console.error('❌ No auth user returned')
      return { ok: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
    }

    console.log('✅ Login exitoso para:', userData.nombre)
    return { ok: true, data: authData }
  } catch (err) {
    console.error('❌ SignIn error:', err)
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
