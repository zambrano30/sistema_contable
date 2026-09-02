import React from 'react'

export function SkillBadge({ 
  label, 
  variant = 'pro', 
  icon = null, 
  size = 'md', 
  pulse = false, 
  tooltip = null,
  onClick = null 
}) {
  const variantStyles = {
    pro: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-amber-500/10',
    sri: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-emerald-500/10',
    sync: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 shadow-blue-500/10',
    ai: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 shadow-purple-500/10',
    warning: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 shadow-rose-500/10',
    info: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 shadow-cyan-500/10',
    neutral: 'bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15 shadow-black/20',
  }

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm backdrop-blur-md transition-all duration-200 ${
        variantStyles[variant] || variantStyles.pro
      } ${sizeStyles[size] || sizeStyles.md} ${
        onClick ? 'cursor-pointer hover:scale-105 hover:brightness-110 active:scale-95' : ''
      }`}
      title={tooltip || label}
      onClick={onClick}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {icon && (
        <span className="material-symbols-outlined text-sm leading-none">{icon}</span>
      )}
      <span>{label}</span>
    </span>
  )
}
