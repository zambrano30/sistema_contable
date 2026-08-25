import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthStateChange, signOut } from '../services/authService'
import { getCurrentUser } from '../services/userService'

const AuthContext = createContext()

// Función para traducir y capitalizar roles
const normalizeRole = (role) => {
  if (!role) return 'Administrador'
  
  const roleMap = {
    'admin': 'Administrador',
    'administrator': 'Administrador',
    'administrador': 'Administrador',
    'seller': 'Vendedor',
    'saler': 'Vendedor',
    'vendedor': 'Vendedor',
    'accountant': 'Contador',
    'contador': 'Contador',
    'manager': 'Gerente',
    'gerente': 'Gerente',
    'cook': 'Cocinero',
    'cooker': 'Cocinero',
    'cocinero': 'Cocinero',
    'chef': 'Cocinero',
  }
  
  const normalized = roleMap[role.toLowerCase()] || role
  // Capitalizar primera letra
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;['demo_user', 'demo_invoices', 'demo_clients', 'demo_products', 'demo_movements', 'demo_commands', 'demo_cooks', 'demo_vendors', 'cash_closings']
      .forEach((key) => localStorage.removeItem(key))

    const initAuth = async () => {
      const result = await getSession()

      if (result.ok && result.data?.session) {
        const authUser = result.data.session.user
        // Obtener datos del usuario desde la tabla users (incluyendo rol)
        const dbUser = await getCurrentUser()
        
        if (dbUser) {
          // Combinar datos de autenticación con datos de base de datos
          const userData = {
            ...authUser,
            role: normalizeRole(dbUser.role || 'Administrador')
          }
          setUser(userData)
        } else {
          // Si no existe en BD, crear con rol por defecto
          authUser.role = 'Administrador'
          setUser(authUser)
        }
      }

      setLoading(false)
    }

    initAuth()

    const unsubscribe = onAuthStateChange((session) => {
      if (session?.user) {
        // Obtener rol desde BD cuando cambia la sesión
        getCurrentUser().then(dbUser => {
          const userData = {
            ...session.user,
            role: normalizeRole(dbUser?.role || 'Administrador')
          }
          setUser(userData)
        }).catch(() => {
          // Fallback si hay error
          session.user.role = 'Administrador'
          setUser(session.user)
        })
      } else {
        setUser(null)
      }
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
