import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthStateChange, signOut } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const result = await getSession()

      if (result.ok && result.data?.session) {
        setUser(result.data.session.user)
      }

      setLoading(false)
    }

    initAuth()

    const unsubscribe = onAuthStateChange((session) => {
      setUser(session?.user ?? null)
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
