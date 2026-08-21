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
    'vendedor': 'Vendedor',
    'accountant': 'Contador',
    'contador': 'Contador',
    'manager': 'Gerente',
    'gerente': 'Gerente',
    'cook': 'Cocinero',
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
    // Check if demo session exists
    const storedDemoUser = localStorage.getItem('demo_user')
    if (storedDemoUser) {
      try {
        setUser(JSON.parse(storedDemoUser))
        setLoading(false)
        return
      } catch (e) {
        localStorage.removeItem('demo_user')
      }
    }

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
      if (!localStorage.getItem('demo_user')) {
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
      }
    })

    return unsubscribe
  }, [])

  const loginAsDemo = (email) => {
    const demoUserObj = { 
      email: email || 'admin@facturapro.com',
      id: 'demo-user-admin',
      role: 'Administrador'
    }
    localStorage.setItem('demo_user', JSON.stringify(demoUserObj))
    setUser(demoUserObj)
  }

  const logout = async () => {
    localStorage.removeItem('demo_user')
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginAsDemo }}>
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
