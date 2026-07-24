import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../services/authService'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authFn = isSignUp ? signUp : signIn
      const result = await authFn(email, password)

      if (result.ok) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1>Sistema contable</h1>
        <h2>{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading
              ? isSignUp
                ? 'Creando cuenta...'
                : 'Iniciando sesión...'
              : isSignUp
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="btn-link"
            >
              {isSignUp ? 'Inicia sesión' : 'Crea una'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
