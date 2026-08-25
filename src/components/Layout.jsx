import { useState } from 'react'
import { Sidebar } from './Sidebar'

export function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
