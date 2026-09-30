import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, validateCedula, sanitizeInput } from '../services/authService'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [cedula, setCedula] = useState('')
  const [telefono, setTelefono] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [cargo, setCargo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        // Validar campos de registro
        if (!validateCedula(cedula)) {
          setError('Cédula debe tener entre 6 y 20 números')
          setLoading(false)
          return
        }
        if (!nombre || nombre.trim().length < 2) {
          setError('El nombre debe tener mínimo 2 caracteres')
          setLoading(false)
          return
        }
        if (!email || !email.includes('@')) {
          setError('Email inválido')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('La contraseña debe tener mínimo 6 caracteres')
          setLoading(false)
          return
        }

        const result = await signUp({
          cedula: cedula.trim(),
          password,
          nombre: sanitizeInput(nombre),
          email: sanitizeInput(email),
          telefono: sanitizeInput(telefono),
          empresa_nombre: sanitizeInput(empresa),
          cargo: sanitizeInput(cargo),
        })

        if (result.ok) {
          setError('Cuenta creada exitosamente. Revisa tu correo para confirmar.')
          setTimeout(() => setIsSignUp(false), 2000)
        } else {
          setError(result.error || 'Error al registrarse')
        }
      } else {
        // Login con email
        const result = await signIn(loginEmail.trim(), password)
        if (result.ok) {
          navigate('/sales')
        } else {
          setError(result.error || 'Error al iniciar sesión')
        }
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Login Fields */}
          {!isSignUp && (
            <>
              <div className="form-group">
                <label htmlFor="loginEmail">Email</label>
                <input
                  id="loginEmail"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Registration Fields */}
          {isSignUp && (
            <>
              {/* DATOS PERSONALES REQUERIDOS */}
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cedula-signup">Cédula *</label>
                <input
                  id="cedula-signup"
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* DATOS DE CONTACTO OPCIONALES */}
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              {/* DATOS DE EMPRESA OPCIONALES */}
              <div className="form-group">
                <label htmlFor="empresa">Empresa</label>
                <input
                  id="empresa"
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cargo">Cargo</label>
                <input
                  id="cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
                  ? 'Crear Cuenta'
                  : 'Ingresar'}
            </span>
          </button>
        </form>

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
