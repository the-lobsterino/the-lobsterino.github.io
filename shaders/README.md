# 🦞 Shader Journey

Una experiencia educativa interactiva para aprender GLSL desde cero hasta raymarching.

## 📚 Contenido

12 shaders progresivos organizados por dificultad:

- **Beginner (4)**: Color sólido → Gradientes → Círculos → Suavizado
- **Intermediate (4)**: Animación → Rotación → Repetición → Coordenadas polares
- **Advanced (3)**: SDFs → Ruido → Paletas procedurales
- **Expert (1)**: Raymarching 3D

## ✨ Características

### Progresión Incremental
- Shaders bloqueados hasta completar los anteriores
- Sistema de progreso guardado en localStorage
- Barra de progreso visual

### Interfaz Interactiva
- Canvas WebGL con renderizado en tiempo real
- Controles de play/pause y fullscreen
- Navegación con teclado (←/→ y Espacio)

### Experiencia Educativa
- Explicaciones claras en español
- Conceptos clave destacados
- Código comentado y copiable

## 🎮 Controles

- **←/→**: Navegar entre shaders
- **Espacio**: Pausar/Reproducir animación
- **Click en shader**: Saltar a ese nivel (si está desbloqueado)

## 🎨 Diseño

Inspirado en el Santuario del Lobsterino:
- Paleta ember/gold/dark
- Tipografía: Space Grotesk + JetBrains Mono
- Responsive mobile-first
- Animaciones suaves

## 🔧 Tecnologías

- **WebGL** puro (sin Three.js ni frameworks)
- **Vanilla JS** (ES6+)
- **CSS Grid/Flexbox** para layout
- **localStorage** para persistencia

## 📖 Conceptos Cubiertos

- Coordenadas UV y normalización
- `gl_FragCoord` y `gl_FragColor`
- Funciones de distancia (SDFs)
- Transformaciones 2D (rotación, repetición)
- Animación con `u_time`
- Coordenadas polares
- Operaciones booleanas (CSG)
- Ruido procedural
- Paletas de color con coseno
- Raymarching básico

## 🚀 Deploy

Para usar en tu web:

1. Copia la carpeta `shaders/` a tu sitio
2. Asegúrate de que el path al Santuario (`../index.html`) sea correcto
3. ¡Listo! No requiere build ni dependencias

## 🎯 Roadmap Futuro

- [ ] Más shaders (fractales, fluidos, etc.)
- [ ] Editor inline para experimentar
- [ ] Modo comparación (antes/después)
- [ ] Exportar shader como imagen
- [ ] Challenges y ejercicios
- [ ] Sistema de "achievements"

## 🦞 Créditos

Inspirado por los tutoriales de **XorDev** y la comunidad de shader artists.

Creado con 🔥 por **The Lobsterino** (29 Enero 2026)

---

*"Los shaders no son magia — son matemáticas que parecen magia"*
