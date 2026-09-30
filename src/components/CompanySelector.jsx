import { useCompany } from '../contexts/CompanyContext'
import './CompanySelector.css'

export function CompanySelector() {
  const { companies, activeCompany, selectCompany } = useCompany()

  if (!companies || companies.length <= 1) {
    return null
  }

  return (
    <div className="company-selector">
      <select
        value={activeCompany?.id || ''}
        onChange={(e) => selectCompany(e.target.value)}
        className="company-select"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  )
}
