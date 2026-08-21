import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCommands, updateCommandStatus as updateCommandStatusService } from '../services/commandsService'
import { playNotificationSound } from '../services/notificationService'

export default function KitchenPage() {
  const { user } = useAuth()
  const isDemo = !!localStorage.getItem('demo_user')

  const [commands, setCommands] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'preparing', 'ready', 'delivered'
  const [previousPendingCount, setPreviousPendingCount] = useState(0)

  useEffect(() => {
    loadCommands()
    // Actualizar cada 5 segundos
    const interval = setInterval(loadCommands, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadCommands = async () => {
    setLoading(true)

    if (isDemo) {
      // Cargar de localStorage en modo demo
      const demoCommands = JSON.parse(localStorage.getItem('demo_commands') || '[]')
      const sortedCommands = demoCommands.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      // Contar nuevas comandas pendientes
      const newPendingCount = sortedCommands.filter(c => c.status === 'pending').length
      if (newPendingCount > previousPendingCount) {
        playNotificationSound()
      }
      setPreviousPendingCount(newPendingCount)
      
      setCommands(sortedCommands)
    } else {
      // Cargar de Supabase en modo producción
      const result = await getCommands()
      
      if (result.ok) {
        const sortedCommands = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        
        // Contar nuevas comandas pendientes
        const newPendingCount = sortedCommands.filter(c => c.status === 'pending').length
        if (newPendingCount > previousPendingCount) {
          playNotificationSound()
        }
        setPreviousPendingCount(newPendingCount)
        
        setCommands(sortedCommands)
      } else {
        console.error('Error cargando comandas:', result.error)
      }
    }

    setLoading(false)
  }

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
      {/* Header */}
      <header className="page-header">
        <div>
          <span className="text-[0.75rem] font-bold text-[var(--accent-orange-light)] uppercase tracking-wider">
            Lumina Ledger • Cocina
          </span>
          <h1 className="mt-1">
            <span className="material-symbols-outlined text-[var(--accent-orange)] text-3xl">restaurant_menu</span>
            <span>Gestor de Comandas</span>
          </h1>
        </div>
      </header>

      {/* Status Filter Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded border transition ${
            filter === 'all'
              ? 'bg-[var(--accent-orange)] border-[var(--accent-orange)] text-white'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
          }`}
        >
          <div className="text-2xl font-bold">{commands.length}</div>
          <p className="text-sm">Total</p>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded border transition ${
            filter === 'pending'
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.pending}</div>
          <p className="text-sm">Pendiente</p>
        </button>

        <button
          onClick={() => setFilter('preparing')}
          className={`p-4 rounded border transition ${
            filter === 'preparing'
              ? 'bg-yellow-600 border-yellow-600 text-white'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.preparing}</div>
          <p className="text-sm">Preparando</p>
        </button>

        <button
          onClick={() => setFilter('ready')}
          className={`p-4 rounded border transition ${
            filter === 'ready'
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.ready}</div>
          <p className="text-sm">Listo</p>
        </button>

        <button
          onClick={() => setFilter('delivered')}
          className={`p-4 rounded border transition ${
            filter === 'delivered'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]'
          }`}
        >
          <div className="text-2xl font-bold">{statusCounts.delivered}</div>
          <p className="text-sm">Entregado</p>
        </button>
      </div>

      {/* Commands Grid */}
      {filteredCommands.length === 0 ? (
        <div className="card bg-[var(--bg-secondary)] border border-[var(--border-color)] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--text-secondary)] mb-4">
            check_circle
          </span>
          <p className="text-[var(--text-secondary)]">
            {filter === 'all' ? 'No hay comandas' : `No hay comandas ${getStatusLabel(filter).toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommands.map((command) => (
            <div
              key={command.id}
              className={`card border-2 p-6 transition transform hover:scale-105 cursor-pointer ${getStatusColor(command.status)}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-current opacity-50">
                <div>
                  <p className="text-xs opacity-75">COMANDA</p>
                  <p className="text-2xl font-bold">{command.invoice_number}</p>
                </div>
                <span className="material-symbols-outlined text-3xl">
                  {getStatusIcon(command.status)}
                </span>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded text-sm font-bold bg-black bg-opacity-30">
                  {getStatusLabel(command.status)}
                </span>
              </div>

              {/* Items */}
              <div className="mb-6">
                <p className="text-xs opacity-75 mb-2">PRODUCTOS</p>
                <div className="space-y-2">
                  {command.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="flex-1">{item.product_name}</span>
                      <span className="font-bold text-lg ml-2">{item.quantity}</span>
                      <span className="text-xs opacity-75 ml-2">x</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {command.notes && (
                <div className="mb-4 p-2 bg-black bg-opacity-30 rounded text-sm">
                  <p className="text-xs opacity-75 mb-1">NOTAS</p>
                  <p>{command.notes}</p>
                </div>
              )}

              {/* Time */}
              <div className="text-xs opacity-75 mb-6">
                <p>Recibido hace {Math.floor((Date.now() - new Date(command.created_at)) / 60000)} min</p>
              </div>

              {/* Action Button */}
              {command.status !== 'delivered' && (
                <button
                  onClick={() => updateCommandStatus(command.id, getNextStatus(command.status))}
                  className="w-full py-2 px-4 rounded font-bold bg-white bg-opacity-20 hover:bg-opacity-30 transition text-white border border-white border-opacity-50"
                >
                  <span className="material-symbols-outlined inline mr-2 text-lg">arrow_forward</span>
                  {getStatusLabel(getNextStatus(command.status))}
                </button>
              )}

              {command.status === 'delivered' && (
                <div className="w-full py-2 px-4 rounded font-bold bg-white bg-opacity-10 text-center text-white border border-white border-opacity-30">
                  ✓ Completada
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
