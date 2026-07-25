import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthStateChange, signOut } from '../services/authService'

const AuthContext = createContext()

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
        setUser(result.data.session.user)
      }

      setLoading(false)
    }

    initAuth()

    const unsubscribe = onAuthStateChange((session) => {
      if (!localStorage.getItem('demo_user')) {
        setUser(session?.user ?? null)
      }
    })

    return unsubscribe
  }, [])

  const loginAsDemo = (customEmail) => {
    const demoUserObj = { 
      email: customEmail || 'admin@facturapro.com', 
      id: 'demo-user-admin' 
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
