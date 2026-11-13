# 011 — App instalable (PWA): se abre en pantalla completa, sin barra del navegador

- **Estado:** implementado (verificado en Chrome; falta instalarla en tu teléfono y confirmar que abre sin cabecera)
- **Fecha:** 2026-11-14

## Objetivo
Que al instalarla en el celular, Color Machine **se abra como una app de verdad**: pantalla completa, sin la barra del navegador ni el menú de los tres puntos, con su propio ícono y colores, y que cargue rápido incluso con mala señal.

## Por qué hoy aparece esa barra con los tres puntos
La app **todavía no es una PWA**: no tiene `manifest` ni service worker. Cuando "agregás a la pantalla de inicio", el teléfono solo crea un **acceso directo a una pestaña del navegador**, y por eso se ve la cabecera del navegador y los tres puntos. Con un manifest correcto (`display: standalone`), un service worker e íconos propios, el navegador ofrece **"Instalar aplicación"** y la abre sin ningún marco. Después de este spec hay que **borrar el acceso directo viejo y volver a instalarla**.

## Alcance
- Incluye:
  - **Manifest** (nombre, nombre corto, idioma español, `start_url`, `scope`, `id`, `display: "standalone"`, `orientation: "portrait"`, colores de tema y de fondo, íconos).
  - **Íconos** generados a partir del logo pixel (la olla de pintura): 192 y 512 px, **maskable** 512 px (con margen de seguridad), `apple-touch-icon` de 180 px y favicon. Se generan una sola vez con Chrome (sin dependencias nuevas) y se guardan en `public/icons/`.
  - **Service worker** con `vite-plugin-pwa` (ya instalado): precarga de la app (HTML, JS, CSS, fuentes, íconos y el Worker del cálculo), actualización automática en cada deploy y **sin cachear nunca** las llamadas a Supabase (datos y sesión siempre de la red).
  - **Soporte iPhone**: metaetiquetas de app web (`apple-mobile-web-app-capable`, título, estilo de la barra de estado) y márgenes de zona segura.
  - **Color de la barra de estado** igual al de la barra superior de la app (`theme-color`).
  - **Sin conexión**: la app abre igual; las pantallas que necesitan datos muestran un aviso claro ("Sin conexión: no pudimos cargar tus pinturas") con "Reintentar", en lugar de un error técnico.
  - **Despliegue en Vercel**: cabeceras para que el service worker y el manifest nunca queden desactualizados.
- No incluye: notificaciones push, sincronización en segundo plano, botón propio de "Instalar app" dentro de la app (queda para la pantalla *Cuenta* del spec 009), modo oscuro, pantalla de bienvenida personalizada (splash) más allá de la que genera el sistema con el ícono y los colores.

## Plan
1. **Íconos:** dibujar el logo en una página HTML local a tamaño entero (escala por múltiplos para mantener los píxeles nítidos), sobre fondo lavanda y con margen para el modo *maskable*, y capturarlo con Chrome sin interfaz a 512, 192 y 180 px (y 32 para el favicon). Verificar las dimensiones reales de cada PNG.
2. **`vite.config.js`:** configurar `VitePWA` con `registerType: 'autoUpdate'`, el manifest, `workbox.globPatterns` para precargar, `navigateFallback: '/index.html'` y una regla de red-solo (`NetworkOnly`) para el dominio de Supabase. No se activa en desarrollo.
3. **`index.html`:** `theme-color`, `apple-touch-icon`, metaetiquetas de iOS y `viewport` con `viewport-fit=cover` (ya está).
4. **Registro del service worker** en `main.jsx` (`registerSW`), con actualización silenciosa; si hay una versión nueva, se aplica en el siguiente arranque.
5. **Errores de red amigables:** `createRepo` distingue "sin conexión" (`navigator.onLine` o fallo de `fetch`) de otros errores y devuelve un mensaje en español; las pantallas con datos ya muestran el error con "Reintentar".
6. **`vercel.json`:** `Cache-Control: no-cache` para `/sw.js`, `/manifest.webmanifest` y `/registerSW.js`; `immutable` para los archivos con hash.
7. **Verificar en Chrome (build de producción)** con el protocolo de depuración: manifest leído sin errores, **cero errores de instalabilidad** (`Page.getInstallabilityErrors`), service worker activo, recarga **sin red** mostrando la app, y `display-mode: standalone` aplicado.
8. **Tests:** configuración del manifest (campos obligatorios, tamaños de íconos, `display`), regla de red-solo para Supabase, y mensajes de "sin conexión". `npm test`, `npm run lint`, `npm run build`.
9. **Guía para vos** (se entrega al terminar): desinstalar el acceso directo viejo, abrir la URL de Vercel y usar **"Instalar aplicación"** (Android/Chrome) o **Compartir → Agregar a inicio** (iPhone/Safari), y qué mirar para confirmar que abre sin cabecera.

## Archivos a crear/modificar
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`
- `vite.config.js`, `index.html`, `src/main.jsx`
- `vercel.json`
- `src/features/storage/createRepo.js` (mensaje de "sin conexión") y su test
- `src/pwa/manifest.test.js` (configuración) y, si hace falta, `src/pwa/manifestConfig.js` para compartir la configuración con el test
- `CLAUDE.md` (notas de PWA: no cachear Supabase, cómo regenerar los íconos)

## Atomic design
No aplica (sin componentes nuevos). El aviso de "sin conexión" reutiliza los mensajes de error existentes.

## Datos (Supabase)
No aplica. **Regla de seguridad:** las respuestas de Supabase (datos y autenticación) nunca se guardan en el caché del service worker.

## Criterios de aceptación
- [x] El manifest declara `display: standalone`, `start_url`, `scope`, `id`, nombre, colores e íconos de 192, 512 y 512 *maskable*; los PNG existen y tienen exactamente esas dimensiones.
- [x] Chrome no informa **ningún error de instalabilidad** sobre el build de producción.
- [x] El service worker se registra y, tras la primera carga, la app **abre sin conexión** (recarga con la red cortada).
- [x] Las llamadas a Supabase no se sirven desde el caché (regla de red-solo verificada en la configuración y en un test).
- [x] Una versión nueva desplegada se aplica sola en el siguiente arranque y `/sw.js` y el manifest se sirven sin caché (cabeceras en `vercel.json`; la cabecera real se confirma en Vercel).
- [x] Sin conexión, las pantallas con datos muestran un mensaje claro en español con "Reintentar".
- [x] Con `display-mode: standalone` (ventana de aplicación de Chrome) la app carga, sin scroll horizontal y con `viewport-fit=cover`; la zona segura la aplica `global.css`.
- [ ] Instalada desde Android (Chrome) y desde iPhone (Safari), **se abre sin barra del navegador ni tres puntos** (lo confirma el usuario en su teléfono).
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Hay que reinstalar.** El acceso directo actual sigue abriéndose en el navegador; se debe borrar y volver a instalar para ver el cambio.
- **Caché desactualizado.** Un service worker mal configurado puede dejar versiones viejas; por eso `autoUpdate`, cabeceras sin caché para el worker y pruebas de actualización. Si algo falla, se puede desregistrar desde los ajustes del navegador.
- **iPhone.** Safari es más limitado con las PWA (instalación manual desde Compartir, estilos de la barra de estado, teclado); necesita prueba en un iPhone real.
- **Sesión y datos.** Al no cachear Supabase, sin conexión no se puede iniciar sesión ni cargar datos; la app abre pero muestra el aviso.
- **Íconos.** El ícono se ve pequeño en la pantalla de inicio; se prueba el recorte *maskable* para que el logo no quede cortado en los íconos redondos de Android.
- **Pregunta para vos:** ¿el color de la barra de estado y del fondo al abrir lo dejamos **lavanda** (el de la barra superior), o preferís el crema del fondo?

## Resultado y notas de implementación
- **Verificado en Chrome real sobre el build de producción** (`vite preview`, emulación móvil 360x640): manifest leído sin errores; **cero errores de instalabilidad**; service worker `activated`; 19 archivos precargados (incluye `index.html`, el Worker del cálculo, la fuente y los íconos); **nada de otros orígenes en el caché**; con la red cortada la app abre desde el caché (se ve la pantalla de acceso); en una **ventana de aplicación de Chrome** `display-mode: standalone` coincide.
- **Íconos:** `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (logo al 50 % del lienzo para que no lo recorte Android), `apple-touch-icon.png` (180) y `favicon-32.png`, generados con `npm run icons` (`scripts/generate-icons.mjs`, Chrome sin interfaz, sin dependencias). Dimensiones comprobadas por test.
- **Desvío — actualización:** se usó `registerType: 'prompt'` **sin** pedir confirmación en lugar de `autoUpdate`, porque `autoUpdate` recarga todas las ventanas apenas hay versión nueva y podía borrar una mezcla en curso. La versión nueva se instala en segundo plano y se activa al abrir la app otra vez.
- **Desvío — red-solo:** la regla `NetworkOnly` cubre **todo lo que no es del propio origen**, no solo `*.supabase.co`, para que ni la sesión ni los datos puedan cachearse por error.
- **Nombre corto:** "Color Machine" (13 caracteres); algunos lanzadores pueden recortarlo bajo el ícono.
- **iPhone:** barra de estado en `default` (texto oscuro sobre blanco) para que no tape contenido; cuando el spec 009 agregue la barra superior propia se puede pasar a `black-translucent` y usar la zona segura.
- **No se pudo comprobar aquí:** la instalación real en Android e iPhone y que abra sin cabecera (ver "Cómo instalarla").

## Cómo instalarla (para vos)
1. **Borrá el acceso directo viejo** de la pantalla de inicio (mantenelo apretado → Quitar / Eliminar).
2. Abrí la URL de Vercel en **Chrome (Android)**: menú ⋮ → **"Instalar aplicación"** (si solo dice "Agregar a la pantalla de inicio", esperá unos segundos a que termine de cargar y mirá de nuevo el menú). En **iPhone (Safari)**: botón Compartir → **"Agregar a inicio"**.
3. Abrila desde el ícono nuevo (la olla de pintura sobre fondo lavanda): tiene que abrir **sin barra del navegador ni los tres puntos**.
4. Para comprobar el modo sin conexión: abrila una vez con internet, poné el teléfono en modo avión y volvé a abrirla; debería mostrar la pantalla de acceso o el aviso "Sin conexión".
