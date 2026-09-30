import { useState } from 'react'
import { changePassword, resetPasswordRequest } from '../services/authService'

export default function PasswordPage() {
  const [mode, setMode] = useState('change') // 'change' or 'reset'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cedula, setCedula] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (newPassword.length < 6) {
        setError('La contraseña debe tener mínimo 6 caracteres')
        setLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden')
        setLoading(false)
        return
      }

      const result = await changePassword(newPassword)
      if (result.ok) {
        setSuccess('Contraseña actualizada exitosamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(result.error || 'Error al cambiar la contraseña')
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const result = await resetPasswordRequest(cedula)
      if (result.ok) {
        setSuccess('Email de recuperación enviado. Revisa tu correo.')
        setCedula('')
      } else {
        setError(result.error || 'Error al solicitar recuperación')
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-container relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-orange)]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="auth-card relative z-10">
        <div className="auth-header">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] flex items-center justify-center text-white mx-auto shadow-xl shadow-[var(--accent-orange)]/30 mb-4 border border-white/20">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-[var(--text-secondary)] bg-clip-text text-transparent">
            Gestión de Contraseña
          </h1>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('change')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2 px-3 rounded-lg transition ${
              mode === 'change'
                ? 'bg-[var(--accent-orange)] text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Cambiar Contraseña
          </button>
          <button
            onClick={() => {
              setMode('reset')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2 px-3 rounded-lg transition ${
              mode === 'reset'
                ? 'bg-[var(--accent-orange)] text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Recuperar Contraseña
          </button>
        </div>

        {error && (
          <div className="error-message mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {mode === 'change' ? (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base mt-2"
            >
              <span className="material-symbols-outlined">lock_reset</span>
              <span>{loading ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <div className="form-group">
              <label htmlFor="cedula">Cédula</label>
              <input
                id="cedula"
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder=""
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base mt-2"
            >
              <span className="material-symbols-outlined">mail</span>
              <span>{loading ? 'Enviando...' : 'Enviar Email de Recuperación'}</span>
            </button>
          </form>
        )}

        <div className="auth-toggle mt-5 text-center">
          <p className="text-sm text-[var(--text-secondary)] m-0">
            <a href="/login" className="text-[var(--accent-orange)] hover:underline">
              Volver al Login
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
