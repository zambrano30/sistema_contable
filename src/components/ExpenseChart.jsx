import { useMemo } from 'react'

export default function ExpenseChart({ expenses, type = 'category' }) {
  const chartData = useMemo(() => {
    if (type === 'category') {
      const categories = {}
      expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + (exp.amount || 0)
      })
      return categories
    } else if (type === 'trend') {
      // Últimos 7 días
      const days = {}
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        days[dateKey] = 0
      }
      
      expenses.forEach(exp => {
        const dateKey = exp.expense_date
        if (dateKey in days) {
          days[dateKey] += exp.amount || 0
        }
      })
      return days
    }
    return {}
  }, [expenses, type])

  const maxValue = useMemo(() => {
    return Math.max(...Object.values(chartData), 1)
  }, [chartData])

  if (type === 'category') {
    return (
      <div className="space-y-3">
        {Object.entries(chartData).map(([category, amount]) => {
          const percentage = (amount / maxValue) * 100
          return (
            <div key={category} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium capitalize">{category}</span>
                <span className="font-mono font-bold text-amber-400">${amount.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (type === 'trend') {
    return (
      <div className="flex items-end justify-between gap-2 h-32">
        {Object.entries(chartData).map(([date, amount]) => {
          const percentage = (amount / maxValue) * 100
          const dateObj = new Date(date)
          const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' })
          
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-2">
              <div className="h-24 bg-white/10 rounded-t-lg relative group cursor-pointer w-full">
                <div 
                  className="h-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg transition-all hover:opacity-80 w-full"
                  style={{ height: `${Math.max(percentage, 5)}%` }}
                />
                {amount > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    ${amount.toFixed(2)}
                  </div>
                )}
              </div>
              <span className="text-xs text-[var(--text-tertiary)] font-medium">{dayName}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return null
}
