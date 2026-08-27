import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
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
            className="lg:hidden text-white hover:text-[var(--accent-orange)] text-2xl cursor-pointer bg-none border-none p-1 flex items-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div className="header-brand cursor-pointer" onClick={() => navigate('/sales')}>
            <div className="header-logo-icon">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="hidden sm:inline font-bold tracking-tight text-[var(--text-primary)]">FacturaPro</span>
          </div>
        </div>

        <div className="header-user flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-[var(--text-primary)]">{user?.email}</span>
            <span className="user-badge self-end mt-0.5">{displayRole}</span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-orange)] to-[#ff7b00] flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-all cursor-pointer border border-white/20 shadow-lg shadow-[var(--accent-orange)]/20 overflow-hidden"
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
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <span className="material-symbols-outlined text-[var(--accent-orange)]">shield_person</span>
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

        <div className="p-4 border-t border-[var(--border-color)]">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''} relative`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined">{item.icon === 'dashboard' ? 'grid_view' : item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
