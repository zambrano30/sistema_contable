import { useState } from 'react'
import { useCompany } from '../contexts/CompanyContext'

export default function CompanySetupPage() {
  const { createCompany, error: companyError } = useCompany()
  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    const result = await createCompany({ name, legalName, taxId })
    if (!result.ok) setError(result.error)
    setSaving(false)
  }

  return (
    <main className="auth-container">
      <section className="card w-full max-w-lg">
        <p className="mb-2 text-sm font-semibold uppercase text-[var(--accent-orange)]">Configuración inicial</p>
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Registra tu empresa</h1>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">Los productos, clientes y facturas quedarán separados para esta empresa.</p>

        {(error || companyError) && (
          <div className="error-message mb-4" role="alert">{error || companyError}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company-name">Nombre comercial</label>
            <input
              id="company-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="company-legal-name">Razón social (opcional)</label>
            <input
              id="company-legal-name"
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="company-tax-id">Identificación fiscal (opcional)</label>
            <input
              id="company-tax-id"
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
            />
          </div>
          <button className="btn-primary w-full justify-center" type="submit" disabled={saving}>
            {saving ? 'Creando empresa...' : 'Crear empresa'}
          </button>
        </form>
      </section>
    </main>
  )
}