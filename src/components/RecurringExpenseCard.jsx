import { useState } from 'react'

export default function RecurringExpenseCard({ recurring, onEdit, onDelete, onProcess }) {
  const [showDetails, setShowDetails] = useState(false)

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'weekly': 'Semanal',
      'biweekly': 'Cada 2 semanas',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'yearly': 'Anual'
    }
    return labels[frequency] || frequency
  }

  const getDaysUntilDue = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntil = getDaysUntilDue(recurring.next_due_date)
  const isDueSoon = daysUntil <= 3
  const isOverdue = daysUntil < 0

  return (
    <div className={`card border-l-4 cursor-pointer transition-all ${
      isOverdue ? 'border-red-500 bg-red-950/20' : isDueSoon ? 'border-amber-500 bg-amber-950/20' : 'border-emerald-500'
    }`}>
      <div onClick={() => setShowDetails(!showDetails)} className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">{recurring.item_name}</h3>
              {isOverdue && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  VENCIDO
                </span>
              )}
              {isDueSoon && !isOverdue && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">alarm</span>
                  PRÓXIMO
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] capitalize">{getFrequencyLabel(recurring.frequency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold font-mono text-amber-400">${recurring.amount.toFixed(2)}</p>
            <p className="text-xs text-[var(--text-tertiary)]">por período</p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
          <span className="material-symbols-outlined text-sm text-blue-400">event</span>
          <span className="text-sm text-[var(--text-secondary)]">Próxima fecha:</span>
          <span className="text-sm font-bold text-white">
            {new Date(recurring.next_due_date).toLocaleDateString('es-ES')}
          </span>
          <span className={`ml-auto text-xs font-bold ${
            isOverdue ? 'text-red-400' : isDuesSoon ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {isOverdue ? `${Math.abs(daysUntil)} días atrasado` : `En ${daysUntil} días`}
          </span>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">Categoría</span>
              <p className="font-bold text-white capitalize">{recurring.category}</p>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Frecuencia</span>
              <p className="font-bold text-white">{getFrequencyLabel(recurring.frequency)}</p>
            </div>
            {recurring.description && (
              <div className="col-span-2">
                <span className="text-[var(--text-secondary)]">Descripción</span>
                <p className="font-bold text-white">{recurring.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={() => onProcess(recurring)}
              className="flex-1 btn-primary btn-small"
              title="Procesar ahora"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Procesar Ahora</span>
            </button>
            <button
              onClick={() => onEdit(recurring)}
              className="btn-secondary btn-small"
              title="Editar"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              onClick={() => onDelete(recurring.id)}
              className="btn-danger btn-small"
              title="Eliminar"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
