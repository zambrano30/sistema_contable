import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle({ showLabel = true, className = '' }) {
  const { theme, toggleTheme } = useTheme()

  const isLight = theme === 'light'

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-md backdrop-blur-md ${
        isLight
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 hover:bg-amber-500/20 hover:border-amber-500/50'
          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 hover:border-indigo-500/50'
      } ${className}`}
      title={isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
      aria-label={isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
    >
      <span className="material-symbols-outlined text-lg leading-none transition-transform duration-300 transform hover:scale-110">
        {isLight ? 'light_mode' : 'dark_mode'}
      </span>
      {showLabel && (
        <span className="text-xs font-bold tracking-tight">
          {isLight ? 'Claro' : 'Oscuro'}
        </span>
      )}
    </button>
  )
}
