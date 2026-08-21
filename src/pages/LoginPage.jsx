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
          loginAsDemo(email)
          navigate('/sales')
        } else if (result.data?.session?.user) {
          navigate('/sales')
        } else {
          loginAsDemo(email)
          navigate('/sales')
        }
      } else {
        loginAsDemo(email)
        navigate('/sales')
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = () => {
    loginAsDemo('admin@facturapro.com')
    navigate('/sales')
  }

  return (
    <main className="auth-container relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-orange)]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="auth-card relative z-10">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] flex items-center justify-center text-white mx-auto shadow-xl shadow-[var(--accent-orange)]/30 mb-4 border border-white/20">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-[var(--text-secondary)] bg-clip-text text-transparent">
            FacturaPro
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isSignUp ? 'Crea tu cuenta profesional de facturación' : 'Sistema Contable y Facturación Electrónica'}
          </p>
        </div>

        {error && (
          <div className="error-message mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="relative flex items-center">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full pl-11"
                required
              />
              <span className="material-symbols-outlined absolute left-3.5 text-[var(--text-tertiary)] text-xl pointer-events-none">
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
                className="w-full pl-11"
                required
              />
              <span className="material-symbols-outlined absolute left-3.5 text-[var(--text-tertiary)] text-xl pointer-events-none">
                lock
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full justify-center py-3.5 text-base mt-2"
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
                  ? 'Crear Cuenta Profesional'
                  : 'Ingresar al Sistema'}
            </span>
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-6 pt-5 border-t border-[var(--border-color)] text-center">
          <p className="text-xs text-[var(--text-tertiary)] mb-3">¿Deseas probar la plataforma sin registrarte?</p>
          <button 
            onClick={handleDemoAccess}
            className="btn-secondary w-full justify-center py-3 text-sm hover:border-[var(--accent-orange)]/40"
          >
            <span className="material-symbols-outlined text-[var(--accent-orange)] animate-pulse">bolt</span>
            <span>Acceso Instantáneo Modo Demo</span>
          </button>
        </div>

        <div className="auth-toggle mt-5 text-center">
          <p className="text-sm text-[var(--text-secondary)] m-0">
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
