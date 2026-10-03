import './App.css'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CompanyProvider, useCompany } from './contexts/CompanyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { LoadingScreen } from './components/LoadingScreen'
import { OfflineIndicator } from './hooks/useOffline.jsx'
import InstallPrompt from './components/InstallPrompt'
import { offlineDB } from './lib/offlineDB'
import { syncManager } from './lib/syncManager'
import LoginPage from './pages/LoginPage'
import PasswordPage from './pages/PasswordPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import SalesPage from './pages/SalesPage'
import InvoicesPage from './pages/InvoicesPage'
import InventoryPage from './pages/InventoryPage'
import ExpensesPage from './pages/ExpensesPage'
import KitchenPage from './pages/KitchenPage'
import AdminPage from './pages/AdminPage'
import CashClosingPage from './pages/CashClosingPage'
import CoinCounterPage from './pages/CoinCounterPage'
import CompanySetupPage from './pages/CompanySetupPage'
import WaitingForCompanyAssignment from './pages/WaitingForCompanyAssignment'

// Hacer accesibles globalmente para debugging
window.offlineDB = offlineDB
window.syncManager = syncManager

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Inicializando sesión..." />
  }

  if (!user) {
    return <Navigate to="/" />
  }

  return children
}

function AppContent() {
  const { user, loading } = useAuth()
  const { activeCompany, loading: companyLoading } = useCompany()

  if (loading) {
    return <LoadingScreen message="Inicializando aplicación..." />
  }

  if (user && companyLoading) {
    return <LoadingScreen message="Cargando empresa..." />
  }

  if (user && !activeCompany) {
    // Si es vendedor (sales), mostrar pantalla de espera en lugar de obligar a crear empresa
    const isVendedor = user.role && (user.role.toLowerCase() === 'vendedor' || user.role.toLowerCase() === 'sales')
    if (isVendedor) {
      return <WaitingForCompanyAssignment />
    }
    return <CompanySetupPage />
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={
        user.role?.toLowerCase() === 'cocinero' ? '/kitchen' :
        user.role?.toLowerCase() === 'administrador' || user.role?.toLowerCase() === 'admin' ? '/dashboard' :
        '/sales'
      } /> : <LoginPage />} />
      <Route path="/password" element={<PasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <Layout>
              <ClientsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Layout>
              <SalesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoicesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout>
              <InventoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout>
              <ExpensesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-closing"
        element={
          <ProtectedRoute>
            <Layout>
              <CashClosingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coin-counter"
        element={
          <ProtectedRoute>
            <Layout>
              <CoinCounterPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute>
            <Layout>
              <KitchenPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company-setup"
        element={
          <ProtectedRoute>
            <CompanySetupPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  useEffect(() => {
    const initOffline = async () => {
      try {
        await offlineDB.init()
        await syncManager.init()
      } catch (error) {
        // Error inicializando modo offline
      }
    }
    initOffline()
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <AppContent />
            <OfflineIndicator />
            <InstallPrompt />
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
