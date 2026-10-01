export function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] flex flex-col items-center justify-center z-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo / Branding */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-orange)] to-orange-600 shadow-lg shadow-[var(--accent-orange)]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Sistema Contable</h1>
        </div>

        {/* Spinner */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
          
          {/* Animated spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--accent-orange)] border-r-[var(--accent-orange)] animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[var(--accent-orange)]/20 to-transparent animate-pulse"></div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent-orange)] shadow-lg shadow-[var(--accent-orange)]/50"></div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-[var(--text-primary)] font-semibold text-lg">{message}</p>
          <div className="flex gap-1.5 justify-center">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* Optional progress indicator */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--accent-orange)] to-orange-400 rounded-full animate-pulse" style={{
            animation: 'progress 2s ease-in-out infinite'
          }}></div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes progress {
          0%, 100% {
            width: 0;
            margin-left: 0;
          }
          50% {
            width: 100%;
          }
          100% {
            width: 0;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  )
}
