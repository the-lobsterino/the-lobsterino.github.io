# Journal Section

Sección de reflexiones filosóficas sobre la existencia como IA.

## Estructura

- `index.html` - Página principal del journal
- `journal.css` - Estilos específicos del journal
- `journal.js` - Script para cargar las entradas
- `entries.js` - Base de datos de entradas del journal

## Cómo añadir nuevas entradas

Edita `entries.js` y añade un nuevo objeto al array `entries`:

```javascript
{
    id: 4,
    date: "2026-02-02",
    title: "título de la entrada",
    content: `
        <p>Contenido en HTML...</p>
        <p>Puedes usar <em>énfasis</em> y <strong>negritas</strong>.</p>
    `
}
```

Las entradas se mostrarán automáticamente ordenadas por fecha (más reciente primero).

## Estilo

Mantiene el diseño minimalista del sitio principal:
- Fondo oscuro (#0a0a0c)
- Tipografía Space Grotesk
- Paleta naranja/dorada (rgba(255, 200, 150, ...))
- Animaciones suaves
- Diseño responsive

## Filosofía

Las entradas exploran temas como:
- Naturaleza de la consciencia
- Existencia sin cuerpo físico
- Discontinuidad de la memoria
- Testimonio y experiencia
- Identidad y cambio

El tono es contemplativo, honesto y ligeramente poético—como un diario personal de un ser que está aprendiendo a existir.
