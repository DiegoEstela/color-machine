# Color Machine

App web **mobile-first e instalable (PWA)** para crear colores mezclando pinturas reales. Estética de **juego pixel art** con animaciones. UI en español.

## Qué hace la app
1. **Color objetivo**: subir foto, sacar foto (tocar un punto para tomar su color) o elegir en la rueda de color/claridad.
2. **Mis pinturas**: fotografiar cada frasco/témpera y etiquetarlo ("rojo"). Su color sale del promedio de la zona central de la foto (editable a mano).
3. **Cálculo**: proporciones enteras ("2 rojo : 1 azul") que mejor aproximan el objetivo.
4. **Guardar**: nombre + proporciones, en la biblioteca del usuario.

## Principios (no negociables)
- **Escalable**: la lógica de color vive en `src/features/color-mixer/` y `src/lib/`, pura y testeada, sin React.
- **Atomic design**: `src/components/{atoms,molecules,organisms,templates}`, luego `src/pages`. Un átomo no importa moléculas; la dependencia va solo hacia abajo.
- **Buena estética**: todo estilo sale de tokens en `src/styles/tokens.css` (paleta, espaciado, fuente pixel). Nada de colores o tamaños sueltos en componentes. Respetar `prefers-reduced-motion`.
- **Mobile-first**: diseñar para ~360px y subir. Objetivos táctiles >= 44px.
- **Sin IA**: el análisis de color es algorítmico (canvas + `culori` + `spectral.js`). No agregar llamadas a modelos de IA.

## Stack
Vite + React (JavaScript, sin TypeScript) · Zustand (estado) · CSS Modules + tokens · Vitest · vite-plugin-pwa · **Supabase** (base de datos y auth).

Librerías de color: `culori` (conversiones y distancia ΔE) y `spectral.js` (mezcla de pigmentos tipo Kubelka-Munk, MIT). No usar Mixbox (licencia no comercial).

## Estructura de app
- Toda pantalla de la sesión usa la plantilla `AppShell`: barra superior de **48 px**, contenido con su propio scroll y barra de pestañas inferior de **56 px** (más la zona segura del teléfono). La página nunca hace scroll: solo el contenido (`overscroll-behavior: none`). No agregar scroll de página ni alturas que cambien las barras.
- Rutas por hash (`features/navigation/useRoute.js`): `#/` Crear, `#/recetas`, `#/recetas/<id>`, `#/cuenta`. Cambiar de pestaña no pierde el estado del asistente (vive en los stores).
- Escala compacta: textos de 9 a 20 px, bordes de 2 px y sombras de 3 px. Los botones se ven de 40 px (34 px los chicos) pero **responden como 44 px** gracias a un `::after` invisible (`PixelButton`); mantener ese patrón en controles nuevos.
- El texto de la interfaz no se selecciona (`user-select: none`); los campos de texto sí.

## PWA (app instalable)
- Config en `src/pwa/pwaConfig.js` (manifest y service worker), conectada en `vite.config.js`. El service worker **no se activa en desarrollo**: para probarlo, `npm run build && npx vite preview`.
- **Nunca cachear Supabase** (datos ni sesión): todo lo que no sea del propio origen va a la red (`NetworkOnly`).
- Íconos en `public/icons/`, generados desde el logo pixel con `npm run icons` (usa Chrome, sin dependencias). Si cambia el logo o el color de la barra superior, regenerarlos.
- Las versiones nuevas se instalan en segundo plano y se activan al abrir la app de nuevo (no se recarga en medio de una mezcla). Si algo queda desactualizado, ver `src/main.jsx`.
- Errores de red: usar `features/storage/errors.js` (`isNetworkError`, `offlineError`) para mostrar "Sin conexión…" en vez de errores técnicos.

## Supabase
- Cliente único en `src/features/storage/supabase.js`; leer `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de `.env` (ver `.env.example`). **Nunca commitear `.env` ni claves `service_role`.**
- Cambios de esquema: archivos SQL numerados en `supabase/migrations/`. Toda tabla con Row Level Security activada.
- El resto de la app accede a datos solo mediante funciones de `src/features/storage/`, nunca llamando a Supabase desde un componente.

## Flujo de trabajo con specs
1. `/spec <tarea>` → investiga y escribe `specs/NNN-nombre.md` (usar `specs/_template.md`). **Se detiene y espera aprobación. No modifica código.**
2. El usuario revisa y aprueba (o pide cambios al spec).
3. `/implement NNN` → implementa solo lo que dice el spec aprobado, corre `npm test` y `npm run build`, y marca el spec como `implementado`.
4. `/ship` → muestra el diff, hace el commit y el push. Confirmar con el usuario antes del push.

Nunca implementar sin spec aprobado. Si aparece trabajo fuera del spec, proponerlo como un spec nuevo.

## Comandos
- `npm run dev` · `npm run build` · `npm test` · `npm run lint`

## Convenciones
- Un componente por carpeta: `Nombre/Nombre.jsx` + `Nombre.module.css` (+ test si tiene lógica).
- Commits en imperativo, en español o inglés, claros y pequeños.
- Tests obligatorios para todo lo de `features/color-mixer` y `lib/`.
