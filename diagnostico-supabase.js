// Diagnóstico de Supabase
const supabaseUrl = 'https://wkctgutrokyzakytufev.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY3RndXRyb2t5emFreXR1ZmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTI5NTEsImV4cCI6MjA5OTM4ODk1MX0.kwgJsZs2Qvj8q1t09N59A_3tVaD4sdFm08OKwbuN5Mc'

console.log('🔍 Verificando conexión a Supabase...')
console.log('URL:', supabaseUrl)
console.log('API Key configurada:', supabaseAnonKey ? '✅' : '❌')

// Test 1: Verificar que Supabase responde
fetch(`${supabaseUrl}/rest/v1/`)
  .then(r => {
    console.log('\n📡 Test de respuesta HTTP:')
    console.log('Status:', r.status, r.status === 401 ? '(Autenticación requerida - ESPERADO)' : '')
    return r.text()
  })
  .catch(e => {
    console.error('❌ Error de conexión:', e.message)
  })

// Test 2: Intentar obtener usuario autenticado
fetch(`${supabaseUrl}/auth/v1/user`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
})
  .then(r => {
    console.log('\n🔐 Test de autenticación:')
    console.log('Status:', r.status)
    if (r.status === 401) {
      console.log('ℹ️  401 = No hay sesión activa (NORMAL sin login)')
    }
    return r.json()
  })
  .then(data => console.log('Response:', data))
  .catch(e => console.error('❌ Error:', e.message))

// Test 3: Verificar localStorage
console.log('\n💾 Estado de localStorage:')
const demoUser = localStorage.getItem('demo_user')
console.log('demo_user guardado:', demoUser ? '✅ Sí' : '❌ No')
if (demoUser) {
  console.log('Contenido:', JSON.parse(demoUser))
}

console.log('\n✅ Diagnóstico completo. Revisa los resultados arriba.')
