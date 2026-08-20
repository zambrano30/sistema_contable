# 📄 GENERADOR DE FACTURAS PDF - FORMATO SRI

## ✨ LO QUE SE AGREGÓ

### 1. Servicio de Generación de PDFs
**Archivo:** `src/services/invoicePdfService.js`

- Genera PDFs con formato SRI (Ecuador)
- Incluye: Datos empresa, cliente, items, totales
- Estructura lista para agregar firma digital
- Espacio para código QR / código de barras

### 2. Botón de Descarga en Ventas
**Archivo:** `src/pages/SalesPage.jsx`

- Nuevo botón "PDF" en cada factura
- Click → Descarga automática del PDF
- Formato: `Factura-XXXXXX.pdf`

---

## 🎯 CÓMO USAR

### Crear y Descargar Factura

1. **Crear factura:** Click "Nueva Factura"
   - Selecciona cliente
   - Agrega productos
   - Click "Crear Factura"

2. **Descargar PDF:** En tabla de "Facturas Recientes"
   - Busca tu factura
   - Click botón "PDF"
   - Se descarga automáticamente

---

## 📋 CONTENIDO DEL PDF

El PDF incluye:

✅ **Encabezado**
- Nombre empresa
- RUC empresa
- Dirección, teléfono, email

✅ **Información Factura**
- Número de factura
- Fecha emisión
- Fecha vencimiento
- Estado

✅ **Datos Cliente**
- Nombre
- RUC/CI
- Dirección, ciudad
- Teléfono, email

✅ **Detalle de Productos**
- Código producto
- Descripción
- Cantidad
- Valor unitario
- Valor total por línea

✅ **Resumen Financiero**
- Subtotal
- Impuesto (19%)
- TOTAL

✅ **Sección SRI** (sin firma por ahora)
- Espacio para número de autorización
- Espacio para código QR/barcode

---

## 🔐 PRÓXIMO PASO: Agregar Firma Digital

Cuando tengas certificado SRI:

1. Usar librería para firmar XML digitalmente
2. Generar código QR con datos de autorización
3. Integrar con API del SRI
4. Marcar como "Autorizado"

---

## ⚙️ CONFIGURACIÓN EMPRESA

En `handleDownloadPDF()` de SalesPage.jsx, actualiza:

```javascript
generateInvoicePDF(invoice, mockItems, client, {
  name: 'TU EMPRESA',           // ← Cambiar
  ruc: 'TU-RUC-AQUI',          // ← Cambiar
  address: 'Tu dirección',      // ← Cambiar
  phone: 'Tu teléfono',         // ← Cambiar
  email: 'tu@email.com'         // ← Cambiar
})
```

---

## 📦 DEPENDENCIAS

```json
{
  "html2pdf.js": "^0.10.1"
}
```

Ya instalada. ✅

---

## 🎨 PERSONALIZACIÓN

El PDF usa estilos CSS integrados. Para cambiar:
- Colores
- Fuentes
- Márgenes
- Layout

Edita `src/services/invoicePdfService.js` sección `<style>`.

---

## 📱 FORMATO

- **Orientación:** Vertical (Portrait)
- **Tamaño:** A4
- **Márgenes:** 10mm
- **Resolución:** 300 DPI

---

## ✅ ESTADO

- ✅ Generación de PDF básico: COMPLETO
- ✅ Formato SRI: COMPLETO
- ✅ Botón de descarga: COMPLETO
- ⏳ Firma digital (próxima fase): PENDIENTE
- ⏳ Integración SRI API (próxima fase): PENDIENTE
- ⏳ Código QR (próxima fase): PENDIENTE

---

## 🚀 PRÓXIMAS MEJORAS

```
1. Cargar items reales de cada factura
2. Agregar logo empresa
3. Integración con SRI API
4. Firma digital con certificado
5. Código QR automático
6. Envío por email
7. Historial de descargas
```

---

*Sistema Contable • FacturaPro*
*Generación de PDFs SRI • Agosto 2026*
