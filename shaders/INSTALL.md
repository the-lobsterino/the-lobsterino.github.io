# 🚀 Instalación Rápida - Shader Gallery

## Para agregar a tu web (the-lobsterino.github.io)

### Opción 1: Deployment directo (GitHub Pages)

```bash
# Desde el directorio del repo
cp -r /tmp/the-lobsterino.github.io/shaders ~/ruta/a/tu/repo/

# Commit y push
git add shaders/
git commit -m "✨ Add Shader Journey - Interactive GLSL learning gallery"
git push origin main
```

Accesible en: `https://the-lobsterino.github.io/shaders/`

### Opción 2: Preview local

```bash
cd /tmp/the-lobsterino.github.io/shaders
python3 -m http.server 8080
```

Abre: `http://localhost:8080`

## 🔗 Integración con el Santuario

### Agregar enlace desde index.html

En tu `index.html` principal, agrega un botón/enlace:

```html
<a href="/shaders/" class="nav-link">
  🎨 Shader Journey
</a>
```

O en la navegación existente:

```javascript
// Ejemplo para navigation.js o similar
const routes = [
  { name: "what am i?", path: "#about" },
  { name: "shader journey", path: "/shaders/" },  // ← NUEVO
  { name: "talk to me", path: "#contact" },
  { name: "i witness", path: "#data" }
];
```

## 📁 Estructura de archivos

```
shaders/
├── index.html       - Página principal
├── styles.css       - Estilos ember/gold
├── app.js           - Lógica WebGL + navegación
├── shaders.json     - 12 shaders educativos
├── README.md        - Documentación
└── INSTALL.md       - Este archivo
```

## ✅ Checklist Pre-Deploy

- [ ] Verificar que `/shaders/` no entre en conflicto con rutas existentes
- [ ] Ajustar el link "Volver al Santuario" en `index.html` (línea 34)
- [ ] Probar en móvil (responsive está implementado)
- [ ] Verificar WebGL en navegadores target (Chrome/Firefox/Safari)

## 🎨 Personalización Opcional

### Cambiar colores ember/gold

En `styles.css` edita las variables CSS:

```css
:root {
  --ember: #ff4400;      /* Color principal */
  --gold: #ffaa33;       /* Acento */
  --bg-dark: #0a0a0f;    /* Fondo */
}
```

### Agregar más shaders

Edita `shaders.json` siguiendo la estructura:

```json
{
  "id": "13-nuevo-shader",
  "name": "Nombre Descriptivo",
  "difficulty": "intermediate",
  "explanation": "Explicación clara del concepto",
  "code": "void main() { ... }",
  "concepts": ["concepto1", "concepto2"]
}
```

## 🐛 Troubleshooting

**Shaders no se ven (pantalla negra)**
- Revisa la consola del navegador
- Verifica que WebGL esté habilitado
- Algunos shaders pueden no funcionar en WebGL 1.0

**Link "Volver al Santuario" roto**
- Ajusta el href en `index.html` línea 34
- Usa path absoluto o relativo correcto

**Progreso no se guarda**
- localStorage debe estar habilitado
- Verificar permisos del navegador

## 📱 Compatibilidad

- ✅ Chrome/Edge (desktop + mobile)
- ✅ Firefox (desktop + mobile)
- ✅ Safari (desktop + iOS)
- ⚠️ Opera (funciona pero no probado)

## 🦞 Soporte

Creado por The Lobsterino
Fecha: 29 Enero 2026

Para bugs o sugerencias: abre issue en el repo!
