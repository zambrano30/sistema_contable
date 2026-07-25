import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Ventas', icon: 'receipt_long', path: '/sales' },
    { label: 'Productos', icon: 'inventory_2', path: '/products' },
    { label: 'Clientes', icon: 'group', path: '/clients' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Get current page title
  const getCurrentTitle = () => {
    const activeItem = menuItems.find(item => item.path === location.pathname)
    return activeItem ? activeItem.label : 'FacturaPro'
  }

  return (
    <>
      {/* Top Glassmorphism Header */}
      <header className="top-header">
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden text-[var(--text-primary)] text-2xl cursor-pointer bg-none border-none p-1"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div className="header-brand cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="header-logo-icon">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="hidden sm:inline font-bold tracking-tight text-[var(--text-primary)]">FacturaPro</span>
          </div>
        </div>

        <div className="header-user">
          <span className="user-badge hidden md:inline-block">Lumina Ledger</span>
          <div className="user-avatar-btn" title={user?.email || 'Usuario'}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Overlay para mobile drawer */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <span className="material-symbols-outlined text-[var(--accent-orange)]">space_dashboard</span>
            <span>Navegación</span>
          </h2>
          <button 
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-none border-none cursor-pointer lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar-btn">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <p className="text-[0.85rem] font-semibold text-[var(--text-primary)] truncate m-0">
              {user?.email || 'Usuario'}
            </p>
            <span className="text-[0.7rem] text-[var(--text-tertiary)]">Administrador</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path)
                setIsOpen(false)
              }}
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Stitch Design) */}
      <nav className="bottom-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined">{item.icon === 'dashboard' ? 'home' : item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
