// Generar sonido de notificación usando Web Audio API
export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Crear 3 beeps cortos
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800 + (i * 100) // Frecuencias ascendentes
      oscillator.type = 'sine'
      
      const startTime = audioContext.currentTime + (i * 0.15)
      const endTime = startTime + 0.1
      
      gainNode.gain.setValueAtTime(0.3, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)
      
      oscillator.start(startTime)
      oscillator.stop(endTime)
    }
  } catch (error) {
    // Web Audio API not available - notification system operates silently
  }
}
