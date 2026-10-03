# Cambios para Instalabilidad PWA

Esta documentación describe todos los cambios realizados para hacer la aplicación instalable como PWA (Progressive Web App).

## 📋 Cambios Realizados

### 1. **index.html** - Meta Tags Actualizados
- ✅ Agregado `<link rel="manifest" href="/manifest.json" />`
- ✅ Agregado `<meta name="theme-color" content="#000000" />`
- ✅ Agregado `<meta name="description" />` para descripción
- ✅ Agregado soporte para iOS:
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-status-bar-style`
  - `apple-mobile-web-app-title`
  - `apple-touch-icon`

### 2. **public/manifest.json** - Manifest Mejorado
- ✅ Configuración completa de PWA manifest
- ✅ Iconos en múltiples tamaños con propósito maskable
- ✅ Screenshots para mobile y desktop
- ✅ Shortcuts personalizados para:
  - Nueva Factura
  - Clientes
  - Reportes
- ✅ Categorías apropiadas (business, productivity)

### 3. **vite.config.js** - Plugin PWA Configurado
- ✅ Plugin VitePWA habilitado con autoUpdate
- ✅ Workbox configurado para cachear assets
- ✅ Runtime caching para:
  - Google Fonts (cache por 1 año)
  - APIs de Supabase (network first, 1 día)
- ✅ DevOptions habilitadas para desarrollo

### 4. **src/main.jsx** - Service Worker Actualizado
- ✅ Registro de SW de Vite PWA con manejo de errores
- ✅ Callbacks para actualizaciones y modo offline
- ✅ Fallback a SW manual si Vite PWA falla
- ✅ Eventos para detectar cambios de conexión

### 5. **src/components/InstallPrompt.jsx** - Componente Nuevo
- ✅ Componente React para solicitar instalación
- ✅ Detecta evento `beforeinstallprompt`
- ✅ Verifica si la app ya está instalada
- ✅ UI atractiva con Tailwind CSS
- ✅ Se oculta automáticamente cuando se instala

### 6. **src/App.jsx** - Integración del Componente
- ✅ Importado InstallPrompt
- ✅ Agregado a la estructura principal
- ✅ Aparece en todas las páginas

### 7. **tailwind.config.js** - Configuración Tailwind
- ✅ Animación `slideUp` para el prompt de instalación
- ✅ Configuración content para todos los archivos

### 8. **INSTALLATION_GUIDE.md** - Documentación de Instalación
- ✅ Guía completa para usuarios
- ✅ Instrucciones por plataforma (Android, iOS, Windows, macOS)
- ✅ Solución de problemas
- ✅ Tips y características

## 🚀 Cómo Compilar

### Desarrollo
```bash
npm run dev
```

Accede a `http://localhost:5173` (o la URL que muestre Vite)

### Producción
```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`. El plugin PWA generará automáticamente:
- `dist/manifest.json` (mergeado desde public/)
- `dist/sw.js` (Service Worker con Workbox)
- `dist/pwa-register.js` (Sistema de registro PWA)

### Previsualización
```bash
npm run preview
```

## 📱 Pruebas de Instalación

### En Desarrollo

1. Abre DevTools (F12)
2. Ve a la pestaña **Application** → **Manifest**
3. Deberías ver el manifest con todos los iconos
4. Ve a **Service Workers** - Debería mostrar el SW activo
5. Busca el prompt de instalación en la parte inferior derecha

### En Producción

La aplicación se puede instalar en:
- ✅ Chrome/Edge en Windows/Mac/Linux
- ✅ Chrome en Android
- ✅ Safari en iOS 16.4+
- ✅ Firefox en Android
- ✅ Samsung Internet

## 🔍 Verificación

Usa las herramientas de desarrollo del navegador:

1. **Lighthouse** (Chrome DevTools):
   - Ejecuta un audit PWA
   - Debería pasar todas las verificaciones

2. **manifest.json**:
   - Abre `https://yourdomain/manifest.json`
   - Verifica que el JSON es válido

3. **Service Worker**:
   - DevTools → Application → Service Workers
   - Debería estar "activated and running"

4. **HTTPS**:
   - Las PWA requieren HTTPS en producción
   - Localhost funciona en desarrollo

## 🔧 Configuración Avanzada

### Agregar Más Iconos

Edita `public/manifest.json`:
```json
{
  "src": "/icon-192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any"
},
{
  "src": "/icon-192-maskable.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "maskable"
}
```

### Personalizar el Prompt de Instalación

Edita `src/components/InstallPrompt.jsx`:
- Cambiar colores
- Agregar más información
- Mostrar el prompt automáticamente o manualmente

### Runtime Caching

Edita `vite.config.js` en la sección `workbox.runtimeCaching`:
```javascript
{
  urlPattern: /^https:\/\/api\.ejemplo\.com\/.*/i,
  handler: 'NetworkFirst', // o 'CacheFirst'
  options: {
    cacheName: 'mi-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 // 1 día
    }
  }
}
```

## 📚 Recursos

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Vite PWA Plugin](https://vite-plugin-pwa.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

## ✅ Checklist de Producción

Antes de hacer deploy:

- [ ] Verificar que todos los iconos existan en `public/`
- [ ] Ejecutar `npm run build`
- [ ] Verificar que `dist/manifest.json` es válido
- [ ] Servir con HTTPS
- [ ] Ejecutar Lighthouse PWA audit
- [ ] Probar instalación en múltiples navegadores
- [ ] Verificar que el Service Worker cachea correctamente
- [ ] Probar funcionamiento offline

## 🐛 Solución de Problemas

### El plugin PWA no genera el SW

Solución:
```bash
rm -rf dist node_modules/.vite
npm run build
```

### Los cambios no aparecen en el navegador

Limpia el caché:
- DevTools → Application → Clear site data
- O abre en incógnito

### HTTPS no funciona en desarrollo

Para testing local con HTTPS:
```bash
npm run build
npm install -g http-server
http-server dist -p 8080 -c-1 --ssl
```

---

¡La aplicación ahora es completamente instalable! 🎉
