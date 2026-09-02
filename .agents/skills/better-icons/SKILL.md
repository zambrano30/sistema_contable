---
name: better-icons
description: >-
  Guía de selección e integración de iconos modernos (Material Symbols, Lucide, badges con animación) para mejorar la comunicación visual. Activa esta skill al agregar iconos a la UI.
---

# Better Icons System Skill

Esta skill garantiza la selección coherente de iconos de alta calidad visual para la interfaz del sistema contable y facturación.

## Reglas de Iconos
1. **Librería Primaria**: Utilizar **Material Symbols Outlined** (`<span className="material-symbols-outlined">icon_name</span>`).
2. **Estilo & Tamaño**:
   - Títulos de sección: 24px - 32px con colores de acento.
   - Botones e ítems de menú: 18px - 20px alineados verticalmente.
   - Badges e indicadores: 14px - 16px.
3. **Iconos Dinámicos & Animados**:
   - Iconos de estado activo: Usar clases de pulsación (`animate-pulse` o `animate-spin` para sincronización).
   - Contenedores de icono: Envolver los iconos en cajas cuadradas redondeadas con fondo traslúcido (`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center`).
4. **Coherencia Semántica**:
   - `point_of_sale` / `receipt_long` para Ventas y Facturación.
   - `verified` / `shield` para SRI y Autenticación.
   - `warehouse` / `inventory_2` para Inventario.
   - `restaurant_menu` para Cocina KDS.
