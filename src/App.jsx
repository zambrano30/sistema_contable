import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CompanyProvider, useCompany } from './contexts/CompanyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
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
    return <div className="loading">Inicializando aplicación...</div>
  }

  if (user && companyLoading) {
    return <div className="loading">Cargando empresa...</div>
  }

  if (user && !activeCompany) {
    return <CompanySetupPage />
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'Cocinero' ? '/kitchen' : '/sales'} /> : <LoginPage />} />
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
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <AppContent />
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
