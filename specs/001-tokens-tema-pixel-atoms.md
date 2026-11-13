# 001 — Tokens, tema pixel y atoms

- **Estado:** implementado
- **Fecha:** 2026-11-13

## Objetivo
Dejar la base visual de la app: un sistema de design tokens con estética pixel art y los átomos reutilizables sobre los que se construirán los pasos siguientes. Al terminar, `npm run dev` muestra una pantalla "catálogo" mobile-first con todos los átomos y sus estados, sirviendo de referencia visual.

## Alcance
- Incluye:
  - `tokens.css`: paleta, espaciado (escala de 4 px), bordes, sombras escalonadas, tipografía, z-index, duraciones.
  - Fuente pixel **Press Start 2P** autoalojada (paquete `@fontsource/press-start-2p`), sin depender de CDN para que funcione offline en la PWA.
  - Estilos globales (`reset`, fondo, `image-rendering: pixelated`, `prefers-reduced-motion`).
  - Átomos: `PixelButton`, `PixelText`, `PixelPanel`, `ColorSwatch`, `PixelInput`, `PixelIcon`, `PixelBar`.
  - Página temporal `Catalog` para verlos en el móvil.
  - Tests de render de los átomos con lógica (variantes, `disabled`, accesibilidad).
- No incluye: moléculas u organismos, animaciones de mezcla, cámara, rueda de color, Supabase, PWA ni navegación entre pasos.

## Plan
1. Instalar `@fontsource/press-start-2p`, `@testing-library/react`, `@testing-library/jest-dom` y `jsdom` (dev) y configurar Vitest con entorno `jsdom`.
2. Crear `src/styles/tokens.css` y `src/styles/global.css`; reemplazar el `index.css` de la plantilla de Vite.
3. Actualizar `index.html`: `lang="es"`, título "Color Machine", `theme-color`, `viewport-fit=cover`. Reemplazar el favicon por uno pixel.
4. Construir cada átomo en su carpeta con CSS Module, usando solo tokens.
5. Crear `pages/Catalog` con todos los átomos y variantes, y montarla desde `App.jsx`.
6. Escribir tests, correr `npm test`, `npm run lint` y `npm run build`.
7. Revisar el catálogo en el navegador a 360 px y a escritorio.

## Archivos a crear/modificar
- `package.json` — dependencias nuevas y entorno de test
- `vite.config.js` — bloque `test` (jsdom, setup)
- `index.html` — idioma, título, meta tags
- `src/index.css` — se elimina; lo reemplaza `src/styles/global.css`
- `src/main.jsx` — importa fuente y estilos globales
- `src/App.jsx` — monta `Catalog`
- `src/styles/tokens.css`, `src/styles/global.css`
- `src/components/atoms/<Nombre>/<Nombre>.jsx` y `<Nombre>.module.css` para cada átomo (más `<Nombre>.test.jsx` donde haya lógica)
- `src/components/atoms/index.js` — exporta todos los átomos
- `src/pages/Catalog/Catalog.jsx` y `Catalog.module.css`
- `public/favicon.svg`

## Atomic design
Átomos nuevos (sin dependencias entre sí salvo tokens):

| Átomo | Props principales | Notas |
|---|---|---|
| `PixelButton` | `variant` (`primary`/`secondary`/`danger`), `size`, `disabled`, `onClick` | Borde duro, sombra escalonada que se "hunde" al presionar. Alto mínimo 48 px. |
| `PixelText` | `as`, `size` (`xs`–`xl`), `tone` | Un solo lugar donde se usa la fuente pixel; la fuente de lectura larga queda en sistema por legibilidad. |
| `PixelPanel` | `tone`, `padding` | Contenedor con marco pixel de 4 px. |
| `ColorSwatch` | `color`, `size`, `selected`, `label` | Muestra un color con borde pixel; `aria-label` con el nombre/hex. |
| `PixelInput` | `label`, `value`, `onChange`, `error` | Etiqueta asociada con `htmlFor`; tamaño de fuente >= 16 px para evitar el zoom automático en iOS. |
| `PixelIcon` | `name`, `size` | Íconos SVG de cuadrícula 8x8 con `shape-rendering: crispEdges`: cámara, imagen, gota, check, cruz, guardar, volver. |
| `PixelBar` | `value`, `max`, `color` | Barra segmentada; se reutilizará para las proporciones. |

Las moléculas y organismos de los hitos siguientes se construirán combinando estos.

## Datos (Supabase)
No aplica en este spec.

## Criterios de aceptación
- [x] Ningún componente usa colores, tamaños ni fuentes fuera de `tokens.css`.
- [x] El catálogo se ve sin scroll horizontal a 360 px y mantiene el aspecto en escritorio.
- [x] Todos los átomos tienen estados `hover`, `focus-visible`, `active` y `disabled` cuando aplica, con foco visible.
- [x] El contraste del texto sobre su fondo cumple WCAG AA.
- [x] Con `prefers-reduced-motion` no hay animaciones ni transiciones.
- [x] La fuente pixel se sirve desde el propio bundle (sin peticiones externas).
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Legibilidad**: Press Start 2P cansa en párrafos largos. Propuesta: usarla solo en títulos, botones y etiquetas cortas, y una fuente de sistema para el resto. ¿Te parece bien?
- **Paleta (decidido por el usuario)**: tema **claro y pastel**, para que los colores guardados sean lo que más resalte. UI neutra (fondo crema/lavanda muy suave, bordes y texto en un tono oscuro desaturado) y acentos pastel suaves. Los colores del usuario deben ser siempre el elemento más saturado de la pantalla. Se verifica el contraste AA del texto y bordes contra el fondo pastel. Cambiar la paleta después solo implica editar `tokens.css`.
- **Dependencias de test**: se suman 3 paquetes de desarrollo; no afectan al bundle.
