import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { loginAsDemo } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authFn = isSignUp ? signUp : signIn
      const result = await authFn(email, password)

      if (result.ok) {
        if (isSignUp && !result.data?.session) {
          // Supabase created account but requires email confirmation
          loginAsDemo(email)
          navigate('/dashboard')
        } else if (result.data?.session?.user) {
          navigate('/dashboard')
        } else {
          // Auto fallback to demo mode so user is never blocked
          loginAsDemo(email)
          navigate('/dashboard')
        }
      } else {
        setError(result.error || 'Error al autenticar')
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = () => {
    loginAsDemo('admin@facturapro.com')
    navigate('/dashboard')
  }

  return (
    <main className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-orange)] to-[#e65100] flex items-center justify-center text-white mx-auto shadow-lg shadow-[var(--accent-orange)]/25 mb-3">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h1>FacturaPro</h1>
          <p>{isSignUp ? 'Crea tu cuenta profesional' : 'Accede a tu plataforma contable'}</p>
        </div>

        {error && <div className="error-message mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="relative flex items-center">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full pl-10"
                required
              />
              <span className="material-symbols-outlined absolute left-3 text-[var(--text-tertiary)] text-xl pointer-events-none">
                mail
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="relative flex items-center">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10"
                required
              />
              <span className="material-symbols-outlined absolute left-3 text-[var(--text-tertiary)] text-xl pointer-events-none">
                lock
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full justify-center py-3 text-base mt-1"
          >
            <span className="material-symbols-outlined">
              {isSignUp ? 'person_add' : 'login'}
            </span>
            <span>
              {loading
                ? isSignUp
                  ? 'Creando cuenta...'
                  : 'Iniciando sesión...'
                : isSignUp
                  ? 'Crear Cuenta'
                  : 'Iniciar Sesión'}
            </span>
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-4 pt-4 border-t border-[var(--border-light)] text-center">
          <button 
            onClick={handleDemoAccess}
            className="btn-secondary w-full justify-center py-2.5 text-sm"
          >
            <span className="material-symbols-outlined text-[var(--accent-orange)]">bolt</span>
            <span>Acceso Rápido / Modo Demo</span>
          </button>
        </div>

        <div className="auth-toggle mt-4">
          <p className="m-0">
            {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta aún?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="btn-link ml-1"
            >
              {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
