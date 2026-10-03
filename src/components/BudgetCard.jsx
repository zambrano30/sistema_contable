export default function BudgetCard({ budget, analysis, onEdit, onDelete }) {
  const percentageUsed = analysis?.percentageUsed || 0
  const isWarning = percentageUsed >= 80
  const isExceeded = percentageUsed >= 100

  const getStatusColor = () => {
    if (isExceeded) return 'from-red-500 to-red-600'
    if (isWarning) return 'from-amber-500 to-orange-500'
    return 'from-emerald-500 to-green-600'
  }

  const getStatusIcon = () => {
    if (isExceeded) return 'error'
    if (isWarning) return 'warning'
    return 'check_circle'
  }

  const getStatusText = () => {
    if (isExceeded) return 'EXCEDIDO'
    if (isWarning) return 'ALERTA'
    return 'OK'
  }

  return (
    <div className="card border-l-4" style={{
      borderColor: isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'
    }}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white capitalize">{budget?.category}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${getStatusColor()} text-white flex items-center gap-1`}>
                <span className="material-symbols-outlined text-sm">{getStatusIcon()}</span>
                {getStatusText()}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {budget?.period === 'monthly' && 'Presupuesto Mensual'}
              {budget?.period === 'quarterly' && 'Presupuesto Trimestral'}
              {budget?.period === 'yearly' && 'Presupuesto Anual'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(budget)}
              className="btn-secondary btn-small"
              title="Editar presupuesto"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              onClick={() => onDelete(budget.id)}
              className="btn-danger btn-small"
              title="Eliminar presupuesto"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">Presupuesto</span>
            <span className="font-mono font-bold">
              ${analysis?.totalSpent?.toFixed(2) || '0.00'} / ${analysis?.budgetAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all rounded-full`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
            <span>{percentageUsed.toFixed(1)}% utilizado</span>
            {!isExceeded && (
              <span className="text-emerald-400">
                Disponible: ${analysis?.remaining?.toFixed(2) || '0.00'}
              </span>
            )}
            {isExceeded && (
              <span className="text-red-400">
                Excedido: ${Math.abs(analysis?.remaining || 0).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-color)]">
          <div className="text-center">
            <span className="material-symbols-outlined text-sm text-[var(--accent-orange)]">receipt</span>
            <p className="text-sm font-bold text-white mt-1">{analysis?.transactionCount || 0}</p>
            <p className="text-xs text-[var(--text-secondary)]">Transacciones</p>
          </div>
          <div className="text-center">
            <span className="material-symbols-outlined text-sm text-blue-400">trending_down</span>
            <p className="text-sm font-bold text-white mt-1 font-mono">${(analysis?.totalSpent || 0).toFixed(2)}</p>
            <p className="text-xs text-[var(--text-secondary)]">Gastado</p>
          </div>
          <div className="text-center">
            <span className="material-symbols-outlined text-sm text-purple-400">calendar_month</span>
            <p className="text-sm font-bold text-white mt-1">
              {budget?.period === 'monthly' && '30d'}
              {budget?.period === 'quarterly' && '90d'}
              {budget?.period === 'yearly' && '365d'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Período</p>
          </div>
        </div>

        {/* Alert Threshold */}
        <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
          <span>Alerta a {budget?.alert_threshold}% del presupuesto</span>
        </div>
      </div>
    </div>
  )
}
