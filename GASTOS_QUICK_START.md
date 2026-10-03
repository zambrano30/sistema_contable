# 🚀 Guía Rápida - Gastos Avanzados

## ⚡ Primeros Pasos

### 1️⃣ Aplicar la Base de Datos
Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Copia y pega el contenido de:
-- scripts/create-expense-advanced-tables.sql
```

> ⚠️ **Importante**: Ejecuta SOLO UNA VEZ. Si da error de "ya existe", ignora.

---

## 📊 Dashboard - Tu Centro de Control

### ¿Qué ves?
- 5 tarjetas con gastos por categoría (clickeables)
- Gráfico circular: Cómo se distribuyen tus gastos
- Gráfico de barras: Últimos 7 días
- Estado de presupuestos
- Próximos gastos automáticos

### Tips:
- 🖱️ Haz clic en cualquier categoría para filtrar gastos
- 📊 Hover en las barras del gráfico para ver montos exactos

---

## 💰 Presupuestos - Controla Tus Límites

### Crear Presupuesto
```
1. Ir a pestaña "💰 Presupuestos"
2. Seleccionar:
   - Categoría (ej: "Insumos / Materia Prima")
   - Período (Mensual / Trimestral / Anual)
   - Monto máximo (ej: $2000)
3. Clic en "Crear"
```

### Entender las Alertas
- 🟢 **Verde**: Gastaste menos del 80% - OK
- 🟡 **Amarillo**: Entre 80-99% - ¡Cuidado!
- 🔴 **Rojo**: 100%+ - **EXCEDIDO**

### Ejemplo Real
```
Presupuesto: $1000 en Insumos (Mensual)
Gastado: $850
Disponible: $150
Porcentaje: 85% ⚠️
→ El sistema te alerta en la pestaña dashboard
```

---

## 🔄 Gastos Recurrentes - Automatización

### Casos de Uso
- 💵 Sueldos mensuales
- 🏠 Arriendo
- 💡 Servicios básicos
- 🔌 Internet/Telefonía

### Crear Recurrente
1. Ir a pestaña "🔄 Recurrentes"
2. Configurar:
   - Nombre (ej: "Sueldo Gerente")
   - Monto ($)
   - Frecuencia (Semanal/Quincenal/Mensual/Trimestral/Anual)
   - Día del mes (para recurrentes mensuales)
3. Guardar

### ¿Cómo Funciona?
```
Día 1: Creas un gasto recurrente
       ↓
Día 30 (próxima fecha): Sistema CREA automáticamente
       el gasto en tu registro
       ↓
Sistema actualiza automáticamente la próxima fecha
       ↓
Proceso se repite
```

### ⏰ Indicadores
- 🟢 En azul: Todo OK, próximo en X días
- 🟠 En naranja: Vence en los próximos 3 días
- 🔴 En rojo: ¡YA VENCIDO! Procésalo manualmente

---

## 📝 Registrar Gastos - El Formulario

### Campos Importantes
```
Categoría ......... Ej: "Bebidas & Envases"
Producto ......... Ej: "Botellas de plástico 500ml"
Cantidad ......... Ej: 50
Precio Unit. ..... Ej: 0.50
Total ............ Se calcula automáticamente (50 x 0.50 = $25)
Fecha ............ Hoy (o cualquier otra)
Notas ............ Ej: "Factura #123 - Distribuidor XYZ"
```

### Tips de Eficiencia
- 📋 El sistema recuerda productos que usaste antes
- 💡 Empieza a escribir un producto → autocompleta
- 🔢 Cantidad + Precio = Total automático
- 📎 Adjunta la factura del proveedor

---

## 📎 Adjuntos - Documentos Respaldo

### ¿Por Qué Adjuntar?
- 📋 Auditoría: Prueba de cada gasto
- ✅ Verificación: Marca como "Verificado"
- 🔍 Rastreo: Quién subió, cuándo

### Cómo Adjuntar
```
Opción 1: Arrastra el archivo al área gris
Opción 2: Haz clic y selecciona el archivo

Tipos aceptados: PDF, Imágenes, Excel, Word
Máximo: 10 MB por archivo
```

### Ejemplo
```
Gasto: $150 - Insumos
├─ Factura_ABC_2024.pdf ✅ Verificada
├─ Photo_2024-10-01.jpg
└─ invoice_details.xlsx
```

---

## 📋 Auditoría - Historial Completo

### ¿Quién Cambió Qué?
La pestaña "📋 Auditoría" muestra:
```
✏️ [Editar] - Juan - Hace 2 horas
   "Cambió cantidad de 50 → 55 unidades"

✅ [Crear] - María - Ayer 10:30 AM
   "Creó gasto de $250 - Servicios Básicos"

🗑️ [Eliminar] - Admin - Hace 3 días
   "Eliminó gasto duplicado"
```

### Uso en Auditorías
- Gerente necesita saber qué gastaron: ✅ Aquí está
- Contable revisa cambios: ✅ Aquí está quién cambió
- Auditor verifica legalmente: ✅ Trazabilidad total

---

## 🔍 Filtros - Busca Lo Que Necesitas

### Filtrar por Categoría
```
Categoría → "Sueldos & Personal"
→ Muestra solo gastos de esa categoría
```

### Filtrar por Fecha
```
Desde: 01/10/2024
Hasta: 31/10/2024
→ Muestra gastos de octubre
```

### Combinar Filtros
```
Categoría: "Servicios Básicos"
Desde: 01/10/2024
Hasta: 31/10/2024
→ Solo servicios de octubre
```

---

## 📊 Gráficos - Visualiza Tu Dinero

### Gráfico Circular
Muestra qué categoría gasta más
```
Insumos ████████ 45%
Sueldos ██████ 30%
Servicios ███ 15%
Otros ██ 10%
```

### Gráfico de Tendencia
Últimos 7 días, día a día
```
Lun: $100
Mar: $150
Mié: $80
Jue: $200  ← Día más alto
Vie: $120
Sáb: $90
Dom: $110
```

### Usa Para:
- 📈 Identificar patrones de gasto
- 📉 Detectar días anormales
- 💡 Planificar presupuestos futuros

---

## 🎯 Flujo de Trabajo Diario

### Mañana
1. 📊 Revisa Dashboard
2. ⚠️ Checa alertas de presupuesto
3. 🔄 Procesa gastos recurrentes si hay

### Durante el Día
4. 📝 Registra cada gasto
5. 📎 Adjunta facturas
6. ✅ Marca como verificado

### Fin de Semana
7. 📋 Revisa auditoría de la semana
8. 💰 Proyecta presupuesto siguiente semana
9. 📊 Analiza gráficos y tendencias

---

## ❓ Preguntas Frecuentes

### P: ¿Se pierden los gastos antiguos?
**R**: No. Todos tus gastos anteriores siguen ahí. Las nuevas características se agregan a lo existente.

### P: ¿Puedo editar un gasto del pasado?
**R**: Sí, pero quedará registrado en auditoría quién lo cambió y cuándo.

### P: ¿Qué pasa si excedo el presupuesto?
**R**: El sistema alerta, pero el gasto se registra. Es tu decisión excepcional.

### P: ¿Los gastos recurrentes se crean automáticamente?
**R**: Sí, en la fecha de vencimiento. Pero puedes crearlos manualmente desde la pestaña "Recurrentes" → "Procesar Ahora".

### P: ¿Quién puede ver la auditoría?
**R**: Solo usuarios autorizados de tu empresa. Los permisos se controlan en Supabase.

### P: ¿Puedo exportar reportes?
**R**: Por ahora puedes imprimirlo (Ctrl+P). Pronto: Excel, PDF, etc.

---

## 🚀 Tips Pro

### ⚡ Acelera Registro de Gastos
1. Usa la misma categoría siempre (mejora autocomplete)
2. Nombres de productos consistentes
3. Adjunta facturas una vez (copia para auditoría)

### 💡 Usa Presupuestos Correctamente
1. Establece presupuesto = gasto promedio + 20%
2. No demasiado ajustado (necesitas flexibilidad)
3. Revisa mensualmente y ajusta

### 🔄 Automatiza Máximo Posible
1. Crea gastos recurrentes para TODO fijo
2. Sueldos, servicios, arriendos
3. Te ahorra 5-10 minutos diarios

---

## 📞 Soporte

Si algo no funciona:
1. Recarga la página (Ctrl+F5)
2. Limpia caché del navegador
3. Contacta al desarrollador con screenshot

**¡Ahora eres un experto en Gastos! 🎉**
