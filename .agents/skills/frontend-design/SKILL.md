---
name: frontend-design
description: >-
  Guía de diseño frontend, estética glassmorphism, paletas HSL premium, componentes reactivos y estándares UI/UX para el agente. Activa esta skill al diseñar o modificar interfaces de usuario.
---

# Frontend Design System Skill

Esta skill define las pautas visuales y arquitectónicas para la creación y modificación de componentes de interfaz de usuario en el proyecto.

## Principios de Diseño
1. **Aesthetics & Elegance**: Utilizar gradientes sutiles, efectos *glassmorphism* (`backdrop-filter: blur`), bordes luminosos y sombras suaves.
2. **Typography Hierarchy**: Emplear fuentes modernas como `'Outfit'` para títulos y `'Inter'` para texto general.
3. **Color Palettes**: Evitar colores saturados planos. Utilizar paletas oscuras oscurecidas con acentos vibrantes (`#ff9f0a`, `#007aff`, `#30d158`).
4. **Micro-interacciones**: Transiciones suaves (`transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`), efectos hover elevadores (`translateY(-2px)`), y retroalimentación activa al hacer clic.
5. **Componentization**: Mantener los elementos modulares y reutilizables en `src/components/`.
