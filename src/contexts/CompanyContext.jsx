import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  createCompanyRecord,
  getCompanyMemberships,
  saveActiveCompanyId,
} from '../services/companyService'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [activeCompanyId, setActiveCompanyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadCompanies = async () => {
      if (!user?.id) {
        setCompanies([])
        setActiveCompanyId(null)
        saveActiveCompanyId(null)
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      const result = await getCompanyMemberships(user.id)
      if (cancelled) return

      if (!result.ok) {
        setError(result.error)
        setCompanies([])
        setActiveCompanyId(null)
        setLoading(false)
        return
      }

      const availableCompanies = result.data.filter((company) => company.id)
      setCompanies(availableCompanies)
      setError('')

      const storedCompanyId = localStorage.getItem('facturapro_active_company_id')
      const selectedCompany = availableCompanies.find((company) => company.id === storedCompanyId)
        || availableCompanies[0]
        || null

      setActiveCompanyId(selectedCompany?.id || null)
      saveActiveCompanyId(selectedCompany?.id || null)
      setLoading(false)
    }

    loadCompanies().catch((loadError) => {
      if (!cancelled) {
        setError(loadError.message)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const selectCompany = (companyId) => {
    if (!companies.some((company) => company.id === companyId)) return false
    setActiveCompanyId(companyId)
    saveActiveCompanyId(companyId)
    return true
  }

  const createCompany = async (details) => {
    const result = await createCompanyRecord(details)
    if (!result.ok) {
      setError(result.error)
      return result
    }

    const membershipResult = await getCompanyMemberships(user.id)
    if (!membershipResult.ok) {
      setError(membershipResult.error)
      return membershipResult
    }

    setCompanies(membershipResult.data)
    setActiveCompanyId(result.data)
    saveActiveCompanyId(result.data)
    setError('')
    return { ok: true }
  }

  const activeCompany = companies.find((company) => company.id === activeCompanyId) || null

  return (
    <CompanyContext.Provider value={{
      companies,
      activeCompany,
      activeCompanyId,
      selectCompany,
      createCompany,
      loading,
      error,
    }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) throw new Error('useCompany must be used inside CompanyProvider')
  return context
}