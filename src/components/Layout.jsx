import { useState } from 'react'
import { Sidebar } from './Sidebar'

export function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        hidden={sidebarHidden}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleHidden={() => setSidebarHidden(!sidebarHidden)}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
