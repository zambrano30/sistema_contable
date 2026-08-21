import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
// import { getCommands, updateCommandStatus as updateCommandStatusService } from '../services/commandsService'
// import { playNotificationSound } from '../services/notificationService'

export default function KitchenPage() {
  const { user } = useAuth()
  const isDemo = !!localStorage.getItem('demo_user')

  const [commands, setCommands] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'preparing', 'ready', 'delivered'
  // const [previousPendingCount, setPreviousPendingCount] = useState(0)

  useEffect(() => {
    // Comandas deshabilitadas por ahora
    // loadCommands()
    // // Actualizar cada 5 segundos
    // const interval = setInterval(loadCommands, 5000)
    // return () => clearInterval(interval)
  }, [])

  // const loadCommands = async () => {
  //   setLoading(true)
  //
  //   if (isDemo) {
  //     // Cargar de localStorage en modo demo
  //     const demoCommands = JSON.parse(localStorage.getItem('demo_commands') || '[]')
  //     const sortedCommands = demoCommands.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  //     
  //     // Contar nuevas comandas pendientes
  //     const newPendingCount = sortedCommands.filter(c => c.status === 'pending').length
  //     if (newPendingCount > previousPendingCount) {
  //       playNotificationSound()
  //     }
  //     setPreviousPendingCount(newPendingCount)
  //     
  //     setCommands(sortedCommands)
  //   } else {
  //     // Cargar de Supabase en modo producción
  //     const result = await getCommands()
  //     
  //     if (result.ok) {
  //       const sortedCommands = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  //       
  //       // Contar nuevas comandas pendientes
  //       const newPendingCount = sortedCommands.filter(c => c.status === 'pending').length
  //       if (newPendingCount > previousPendingCount) {
  //         playNotificationSound()
  //       }
  //       setPreviousPendingCount(newPendingCount)
  //       
  //       setCommands(sortedCommands)
  //     } else {
  //       console.error('Error cargando comandas:', result.error)
  //     }
  //   }
  //
  //   setLoading(false)
  // }

  const updateCommandStatus = async (commandId, newStatus) => {
    if (isDemo) {
      // Actualizar en localStorage en modo demo
      const demoCommands = JSON.parse(localStorage.getItem('demo_commands') || '[]')
      const command = demoCommands.find(c => c.id === commandId)
      if (command) {
        command.status = newStatus
        command.updated_at = new Date().toISOString()
        localStorage.setItem('demo_commands', JSON.stringify(demoCommands))
        loadCommands()
      }
    } else {
      // Actualizar en Supabase en modo producción
      const result = await updateCommandStatusService(commandId, newStatus)
      
      if (result.ok) {
        loadCommands()
      } else {
        console.error('Error actualizando estado:', result.error)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-red-900 border-red-700'
      case 'preparing':
        return 'bg-yellow-900 border-yellow-700'
      case 'ready':
        return 'bg-green-900 border-green-700'
      case 'delivered':
        return 'bg-blue-900 border-blue-700'
      default:
        return 'bg-gray-900 border-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'preparing':
        return 'En Preparación'
      case 'ready':
        return 'Listo'
      case 'delivered':
        return 'Entregado'
      default:
        return 'Desconocido'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'schedule'
      case 'preparing':
        return 'local_fire_department'
      case 'ready':
        return 'check_circle'
      case 'delivered':
        return 'done_all'
      default:
        return 'help'
    }
  }

  const getNextStatus = (currentStatus) => {
    const statuses = ['pending', 'preparing', 'ready', 'delivered']
    const currentIndex = statuses.indexOf(currentStatus)
    return statuses[currentIndex + 1] || currentStatus
  }

  const filteredCommands = filter === 'all' ? commands : commands.filter(c => c.status === filter)

  const statusCounts = {
    pending: commands.filter(c => c.status === 'pending').length,
    preparing: commands.filter(c => c.status === 'preparing').length,
    ready: commands.filter(c => c.status === 'ready').length,
    delivered: commands.filter(c => c.status === 'delivered').length,
  }

  if (loading) return <div className="page-container"><p>Cargando...</p></div>

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">restaurant_menu</span>
            <span>Gestor de Comandas</span>
          </h1>
        </div>
      </header>

      <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-12 text-center mt-8">
        <span className="material-symbols-outlined text-6xl text-[var(--accent-orange)] mb-4 block">build</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Funcionabilidad en Pausa</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          El sistema de comandas ha sido deshabilitado temporalmente.
        </p>
        <p className="text-sm text-[var(--text-secondary)] opacity-75">
          Se reactivará cuando sea necesario. Por ahora, el sistema funciona solo con facturación.
        </p>
      </div>
    </div>
  )
}
