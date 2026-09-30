import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'

export function Sidebar({ collapsed, hidden, onToggle, onToggleHidden }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { companies, activeCompany, activeCompanyId, selectCompany } = useCompany()
  const [isOpen, setIsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  const displayRole = user?.role || 'Administrador'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url)
    }
  }, [user])

  useEffect(() => {
    if (user?.id) {
      const savedAvatar = localStorage.getItem(`avatar_${user.id}`)
      if (savedAvatar) {
        setAvatarUrl(savedAvatar)
      }
    }
  }, [user?.id])

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result
        localStorage.setItem(`avatar_${user?.id || 'demo'}`, base64)
        setAvatarUrl(base64)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error:', error)
      setUploading(false)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const baseMenuItems = [
    { label: 'Ventas', icon: 'receipt_long', path: '/sales' },
    { label: 'Facturas', icon: 'description', path: '/invoices' },
    { label: 'Clientes', icon: 'group', path: '/clients' },
    { label: 'Inventario', icon: 'warehouse', path: '/inventory' },
    { label: 'Cocina', icon: 'restaurant_menu', path: '/kitchen' },
    { label: 'Gastos', icon: 'trending_down', path: '/expenses' },
    { label: 'Cierre de caja', icon: 'point_of_sale', path: '/cash-closing' },
    { label: 'Contar monedas', icon: 'toll', path: '/coin-counter' },
  ]

  let menuItems = baseMenuItems

  if (user?.role === 'Cocinero') {
    menuItems = [
      { label: 'Cocina', icon: 'restaurant_menu', path: '/kitchen' },
    ]
  } else if (user?.role === 'Vendedor') {
    menuItems = [
      { label: 'Ventas', icon: 'receipt_long', path: '/sales' },
      { label: 'Facturas', icon: 'description', path: '/invoices' },
      { label: 'Clientes', icon: 'group', path: '/clients' },
    ]
  } else if (user?.role === 'Administrador') {
    menuItems = [
      ...baseMenuItems,
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'Administración', icon: 'admin_panel_settings', path: '/admin' },
    ]
  }

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      {/* Top Glass Header */}
      <header className="top-header">
        <div className="flex items-center gap-3">
          <button
            className="hidden lg:flex text-white hover:text-[var(--accent-orange)] text-2xl cursor-pointer bg-none border-none p-1 items-center"
            onClick={onToggleHidden}
            aria-label={hidden ? 'Mostrar menú' : 'Ocultar menú'}
            title={hidden ? 'Mostrar menú' : 'Ocultar menú'}
          >
            <span className="material-symbols-outlined">{hidden ? 'menu_open' : 'menu'}</span>
          </button>

          <button 
            className="lg:hidden text-white hover:text-[var(--accent-orange)] text-2xl cursor-pointer bg-none border-none p-1 flex items-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div className="header-brand cursor-pointer flex items-center gap-2" onClick={() => navigate('/sales')}>
            <div className="header-logo-icon">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="hidden sm:inline font-bold tracking-tight text-[var(--text-primary)] font-heading">FacturaPro</span>
          </div>

        </div>

        <div className="header-user flex items-center gap-2 sm:gap-3">
          {companies.length > 1 && (
            <select
              aria-label="Empresa activa"
              value={activeCompanyId || ''}
              onChange={(event) => selectCompany(event.target.value)}
              className="max-w-32 sm:max-w-40 truncate text-xs"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          )}

          <div className="hidden sm:flex flex-col text-right gap-0.5">
            <span className="user-badge">{displayRole}</span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:scale-105 transition-all cursor-pointer border border-white/20 shadow-lg shadow-[var(--accent-orange)]/20 overflow-hidden flex-shrink-0"
            title={uploading ? 'Subiendo...' : 'Cambiar foto de perfil'}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadAvatar}
            disabled={uploading}
            className="hidden"
            aria-label="Subir foto de perfil"
          />
        </div>
      </header>

      {/* Overlay para mobile drawer */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''} ${hidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <span>Panel {displayRole}</span>
          </h2>
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
            title={collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
          >
            <span className="material-symbols-outlined">{collapsed ? 'right_panel_open' : 'left_panel_close'}</span>
          </button>
          <button 
            className="text-[var(--text-tertiary)] hover:text-white bg-none border-none cursor-pointer lg:hidden flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''} justify-between`}
              onClick={() => {
                navigate(item.path)
                setIsOpen(false)
              }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] space-y-2">
          <button 
            className="nav-item justify-start w-full"
            onClick={() => {
              navigate('/company-setup')
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined nav-icon">business</span>
              <span className="nav-label">Nueva Empresa</span>
            </div>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

    </>
  )
}
