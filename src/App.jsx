import './App.css'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import SalesPage from './pages/SalesPage'
import InvoicesPage from './pages/InvoicesPage'
import InventoryPage from './pages/InventoryPage'
import ExpensesPage from './pages/ExpensesPage'
import KitchenPage from './pages/KitchenPage'
import AdminPage from './pages/AdminPage'

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

  if (loading) {
    return <div className="loading">Inicializando aplicación...</div>
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'Cocinero' ? '/kitchen' : '/sales'} /> : <LoginPage />} />
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
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
