// Script para limpiar el localStorage y resetear la sesión
// Ejecuta esto en la consola del navegador (F12 > Console)

// 1. Limpia el localStorage
localStorage.clear()

// 2. Limpia sessionStorage
sessionStorage.clear()

// 3. Elimina todas las cookies
document.cookie.split(";").forEach((c) => {
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
})

// 4. Recarga la página
window.location.href = window.location.origin + '/login'
