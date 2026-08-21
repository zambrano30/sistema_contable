import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [pendingCommands, setPendingCommands] = useState(0)
  const fileInputRef = useRef(null)
  
  // Obtener el rol del usuario desde Supabase
  const displayRole = user?.role || 'Administrador'

  // Control document scroll cuando se abre/cierra el sidebar
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

  // Actualizar displayRole cuando cambie el usuario
  useEffect(() => {
    // displayRole se actualiza automáticamente via user?.role
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url)
    }
  }, [user])

  // Cargar avatar del localStorage
  useEffect(() => {
    if (user?.id) {
      const savedAvatar = localStorage.getItem(`avatar_${user.id}`)
      if (savedAvatar) {
        setAvatarUrl(savedAvatar)
      }
    }
  }, [user?.id])

  // Cargar comandas pendientes cada 5 segundos
  useEffect(() => {
    const loadPendingCommands = () => {
      const isDemo = !!localStorage.getItem('demo_user')
      if (isDemo) {
        const demoCommands = JSON.parse(localStorage.getItem('demo_commands') || '[]')
        const pending = demoCommands.filter(c => c.status === 'pending').length
        setPendingCommands(pending)
      }
    }

    loadPendingCommands()
    const interval = setInterval(loadPendingCommands, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Convertir imagen a base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result
        // Guardar en localStorage (funciona en modo demo y auth)
        localStorage.setItem(`avatar_${user.id}`, base64)
        setAvatarUrl(base64)
        setUploading(false)
        alert('✅ Foto guardada exitosamente')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error: ' + error.message)
      setUploading(false)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const baseMenuItems = [
    { label: 'Ventas', icon: 'receipt_long', path: '/sales' },
    { label: 'Clientes', icon: 'group', path: '/clients' },
    { label: 'Inventario', icon: 'warehouse', path: '/inventory' },
    { label: 'Cocina', icon: 'restaurant_menu', path: '/kitchen' },
    { label: 'Gastos', icon: 'trending_down', path: '/expenses' },
  ]

  // Menú dinámico según el rol
  let menuItems = baseMenuItems

  if (user?.role === 'Cocinero') {
    // Los cocineros solo ven Cocina
    menuItems = [
      { label: 'Cocina', icon: 'restaurant_menu', path: '/kitchen' },
    ]
  } else if (user?.role === 'Vendedor') {
    // Los vendedores solo ven Ventas y Clientes
    menuItems = [
      { label: 'Ventas', icon: 'receipt_long', path: '/sales' },
      { label: 'Clientes', icon: 'group', path: '/clients' },
    ]
  } else if (user?.role === 'Administrador') {
    // Los administradores ven el menú completo + Dashboard + Administración
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
          
          <div className="header-brand cursor-pointer" onClick={() => navigate('/sales')}>
            <div className="header-logo-icon">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="hidden sm:inline font-bold tracking-tight text-[var(--text-primary)]">FacturaPro</span>
          </div>
        </div>

        <div className="header-user">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 rounded-full bg-[var(--accent-orange)] flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer border-2 border-[var(--accent-orange)] overflow-hidden"
            title={uploading ? 'Subiendo...' : 'Click para cambiar foto'}
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
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <span className="material-symbols-outlined text-[var(--accent-orange)]">space_dashboard</span>
            <span>{displayRole}</span>
          </h2>
          <button 
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-none border-none cursor-pointer lg:hidden"
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
              {item.label === 'Cocina' && pendingCommands > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {pendingCommands}
                </span>
              )}
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
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''} relative`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined">{item.icon === 'dashboard' ? 'home' : item.icon}</span>
            <span>{item.label}</span>
            {item.label === 'Cocina' && pendingCommands > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCommands}
              </span>
            )}
          </button>
        ))}
      </nav>
    </>
  )
}
