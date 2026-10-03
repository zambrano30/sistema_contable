# Guía de Instalación - Sistema Contable PWA

La aplicación Sistema Contable ahora puede instalarse como una **Progressive Web App (PWA)** en dispositivos móviles y de escritorio.

## ✅ Requisitos

- **Navegador compatible**: Chrome, Edge, Firefox, Safari (iOS 16.4+)
- **HTTPS**: La aplicación debe estar servida por HTTPS (en desarrollo funciona en localhost)
- **Conexión a Internet**: Para la primera instalación

## 📱 Instalación en Dispositivos Móviles

### Android (Chrome)

1. Abre la aplicación en Chrome
2. Toca el menú ⋮ (tres puntos) en la esquina superior derecha
3. Selecciona **"Instalar aplicación"** o **"Agregar a pantalla de inicio"**
4. Confirma la instalación
5. ¡Listo! La aplicación aparecerá en tu pantalla de inicio

### iOS (Safari)

1. Abre la aplicación en Safari
2. Toca el botón de **compartir** (cuadro con flecha)
3. Desplázate y selecciona **"Agregar a pantalla de inicio"**
4. Dale un nombre (o usa el predeterminado)
5. Toca **"Agregar"**
6. ¡Listo! La aplicación aparecerá en tu pantalla de inicio

## 🖥️ Instalación en Escritorio

### Windows (Edge/Chrome)

1. Abre la aplicación en el navegador
2. Haz clic en el ícono de instalación que aparece en la barra de dirección
   - O ve a Menú → **"Instalar Sistema Contable"**
3. Confirma la instalación
4. La aplicación se abrirá en una ventana separada

### macOS (Safari)

1. Abre la aplicación en Safari
2. Ve a **Safari → Archivo → Agregar a aplicaciones**
3. Selecciona dónde guardar (Dock, Aplicaciones, etc.)
4. ¡Listo! Se creará un acceso directo

## 🚀 Características de la Instalación

Una vez instalada, la aplicación:

✅ **Funciona sin conexión a Internet** - Todos tus datos se sincronizan automáticamente
✅ **Se abre como una app nativa** - Sin la barra de dirección del navegador
✅ **Se actualiza automáticamente** - Nuevas versiones se descargan en segundo plano
✅ **Acceso rápido desde el menú de inicio** - Como cualquier otra aplicación
✅ **Iconos y atajos personalizados** - Crea facturas y accede a reportes directamente

## 📋 Accesos Rápidos (Shortcuts)

Una vez instalada, puedes crear accesos rápidos a:

- **Nueva Factura** - Crear facturas directamente
- **Clientes** - Gestionar tus clientes
- **Reportes** - Ver análisis y reportes

## 🔧 Solución de Problemas

### La opción de instalar no aparece

- Verifica que el navegador esté actualizado
- Espera a que se cargue completamente la aplicación
- Intenta cerrar el navegador y volver a abrir
- Borra el caché del navegador (Ctrl+Shift+Supr)

### La aplicación no funciona offline

- Asegúrate de que el Service Worker se registró:
  - Abre DevTools (F12)
  - Ve a la pestaña "Application" → "Service Workers"
  - Debería estar "active"
- Sincroniza tus datos antes de perder la conexión

### Necesito desinstalar la aplicación

**Android:**
- Mantén presionado el ícono → Desinstalar
- O: Ajustes → Aplicaciones → Sistema Contable → Desinstalar

**iOS:**
- Mantén presionado el ícono → Quitar app → Quitar de pantalla de inicio

**Windows/Mac:**
- Busca la aplicación en Aplicaciones/Programas
- O: Menú del navegador → Desinstalar

## 📚 Documentación Relacionada

- [PWA Manifest](./public/manifest.json) - Configuración de la aplicación
- [Service Worker](./public/service-worker.js) - Funcionamiento offline
- [README](./README.md) - Documentación general

## 💡 Tips

- **Guarda tu contraseña**: La primera vez que ingreses, asegúrate de guardar tu contraseña de forma segura
- **Sincronización**: La app se sincroniza automáticamente cuando hay conexión
- **Almacenamiento**: Los datos se guardan localmente en tu dispositivo
- **Privacidad**: Toda tu información se mantiene en tu dispositivo hasta que la sincronices

---

¿Necesitas ayuda? Consulta la sección de soporte en la aplicación.
