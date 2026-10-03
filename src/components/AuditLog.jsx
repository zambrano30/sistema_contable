export default function AuditLog({ logs }) {
  const getActionLabel = (action) => {
    const labels = {
      'create': { text: 'Creado', icon: 'add_circle', color: 'text-emerald-400' },
      'update': { text: 'Actualizado', icon: 'edit', color: 'text-blue-400' },
      'delete': { text: 'Eliminado', icon: 'delete', color: 'text-red-400' },
      'approve': { text: 'Aprobado', icon: 'check_circle', color: 'text-green-400' },
      'reject': { text: 'Rechazado', icon: 'cancel', color: 'text-red-400' }
    }
    return labels[action] || { text: action, icon: 'info', color: 'text-gray-400' }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
    }
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        <span className="material-symbols-outlined text-4xl">history</span>
        <p className="mt-2">Sin historial de cambios</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log, index) => {
        const actionInfo = getActionLabel(log.action)
        const userName = log.user?.email?.split('@')[0] || 'Sistema'
        
        return (
          <div key={log.id || index} className="flex gap-3 py-3 px-3 hover:bg-white/5 rounded-lg transition-colors border-l-2 border-[var(--border-color)]">
            {/* Icon */}
            <div className="flex-shrink-0 pt-1">
              <span className={`material-symbols-outlined text-lg ${actionInfo.color}`}>
                {actionInfo.icon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold ${actionInfo.color}`}>
                  {actionInfo.text}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  por <span className="text-white font-medium">{userName}</span>
                </span>
              </div>
              
              {log.notes && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">{log.notes}</p>
              )}

              {log.new_values && (
                <div className="text-xs text-[var(--text-tertiary)] mt-1 space-y-1">
                  {Object.entries(log.new_values).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-mono text-white">{key}</span>
                      {log.old_values && log.old_values[key] !== value && (
                        <>
                          <span className="text-gray-500"> {log.old_values[key]} → </span>
                          <span className="text-white">{value}</span>
                        </>
                      )}
                      {(!log.old_values || log.old_values[key] === undefined) && (
                        <span className="text-white"> = {value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Time */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-[var(--text-tertiary)] font-medium">
                {formatTime(log.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
