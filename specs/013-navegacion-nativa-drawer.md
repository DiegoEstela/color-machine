# 013 — Navegación tipo app nativa: barra inferior con "Crear" central y menú lateral (drawer)

- **Estado:** implementado (con las opciones propuestas: 3 pestañas con Crear al centro, "Mis pinturas" solo en el drawer, ☰ y drawer a la izquierda)
- **Fecha:** 2026-11-13

## Objetivo
Que la app se sienta como una app nativa de móvil y no como una web:
1. **Barra inferior** con el botón **Crear** destacado en el **centro** (estilo FAB que sobresale), con **Recetas** a un lado y **Cuenta** al otro.
2. **Header** con botón ☰ que abre un **menú lateral (drawer)** con "Mis pinturas" y un espacio ordenado para secciones futuras.
3. Transiciones entre pantallas, gestos (arrastrar desde el borde para abrir el menú), feedback táctil y respeto de zonas seguras, sin scroll de página.

Hoy: la barra de pestañas ya está abajo (56 px, 3 iguales), pero el header arriba mezcla logo + título + pasos, y "Mis pinturas" solo se ve dentro del paso 2 (no hay forma de administrarlas fuera del asistente).

## Alcance
- Incluye:
  - `TabBar` rediseñada: Recetas · **Crear (central, elevado)** · Cuenta. Alto de la barra **sin cambios (56 px)**; el botón central sobresale ~10 px hacia arriba dentro del contenido (con margen para que no tape nada).
  - Header: ☰ a la izquierda (reemplaza al logo; el logo pasa al drawer), título, `actions` a la derecha. En el detalle de receta se mantiene la flecha ← en lugar de ☰.
  - **Drawer** lateral izquierdo: encabezado (logo + email), lista de ítems definida por datos (`menuItems.js`): **Mis pinturas**, Recetas, Cuenta, y un bloque "Próximamente" fácil de extender. Se cierra con toque afuera, Esc, botón Atrás del teléfono y deslizando hacia la izquierda.
  - Gesto: deslizar desde el borde izquierdo (≤ 20 px) abre el drawer; arrastre sigue al dedo.
  - **Nueva pantalla "Mis pinturas"** (`#/pinturas`): lista, alta (foto/recorte o hex), edición y borrado, reutilizando `PaintList`/`PaintCapture`/`PaintForm`. Sin selección (eso sigue siendo del paso 2).
  - Transiciones: fundido + leve desplazamiento al cambiar de pantalla; el drawer y el scrim animan. Todo con tokens de tiempo y `prefers-reduced-motion`.
  - Feedback táctil: estado `:active` en barra/drawer, `navigator.vibrate(8)` opcional en pestañas (si existe; sin romper en iOS).
  - `-webkit-tap-highlight-color: transparent` y `user-select:none` ya están; se verifica en los controles nuevos.
- No incluye: cambiar la lógica de mezcla, el esquema de Supabase, el login, ni el alto de las barras; swipe entre pestañas; modo oscuro; botón "Instalar app".

## Plan
1. **Navegación (feature, con tests):** `useRoute` suma `#/pinturas` (`{name:'paints'}`, `ROUTES.paints`); `tabFor` devuelve `null` para `paints` (no es pestaña). Nuevo `features/navigation/menuItems.js` con la lista del drawer (id, label, icon, href, sección).
2. **Drawer:** estado de apertura en un `useDrawer`/store chico (`navigationStore`: `drawerOpen`, `open`, `close`). Cierra al navegar. Historial: mismo patrón que `InfoSheet` (`historyGuard`) para que Atrás lo cierre.
3. **`Drawer` (molécula)** + `DrawerItem`: portal, `role="dialog"`, `aria-modal`, foco atrapado y devuelto, Esc; deslizar para cerrar; ancho `min(280px, 82vw)`; respeta zonas seguras.
4. **`usePanDrawer` (hook):** gesto de borde con Pointer Events (umbral, velocidad); no interfiere con el zoom de fotos (`touch-action:none` del visor tiene prioridad) ni con el scroll vertical.
5. **`TabBar`:** 3 ítems con el central como `PixelButton`-like circular/pixel de 52 px (se ve así, responde ≥ 44 px), icono `pot`, etiqueta "Crear"; `aria-current` en la activa. Íconos nuevos en `PixelIcon`: `menu` (☰) y `paint` (pinturas, si `jar` no sirve).
6. **`AppShell`:** header con ☰/←, prop `onMenu` interna (usa el store); monta el `Drawer`; contenedor de contenido con clase de transición disparada por `scrollKey`/ruta.
7. **Página `Paints`** y ruta en `App.jsx`. `Account` gana un acceso a sus pinturas solo si sobra espacio (opcional).
8. **Estilos:** tokens nuevos en `tokens.css` (`--drawer-w`, `--dur-drawer`, `--fab-size`, `--z-drawer`, easing). Nada suelto.
9. **Verificación en Chrome móvil** (harness `.harness/`, luego borrar): 360×640, 390×844, 360×560, con safe-area simulada; paso 1 sin scroll (Rueda y Foto), alto de barras 48/56, zonas táctiles, gesto de borde, reduced-motion.

## Archivos a crear/modificar
- `src/features/navigation/useRoute.js` (+ test) — ruta `paints`.
- `src/features/navigation/menuItems.js`, `navigationStore.js` (+ tests) — datos del menú y estado del drawer.
- `src/hooks/usePanDrawer.js` (+ test) — gesto de borde.
- `src/components/atoms/PixelIcon/icons.js` — íconos `menu`, `paint`.
- `src/components/molecules/Drawer/` (nuevo: jsx, css, test) y `index.js`.
- `src/components/molecules/TabBar/*` — botón central elevado.
- `src/components/templates/AppShell/*` — header con ☰, drawer, transición.
- `src/pages/Paints/` (nuevo) y `src/App.jsx` — nueva pantalla/ruta.
- `src/styles/tokens.css`, `global.css` — tokens y ajustes táctiles.
- `CLAUDE.md` — actualizar estructura, rutas y estado al implementar.

## Atomic design
- Átomos: `PixelIcon` (2 íconos nuevos). Reutiliza `PixelButton`, `PixelText`, `PixelLogo`.
- Moléculas: **`Drawer`** (nueva), `TabBar` (modificada).
- Organismos: reutiliza `PaintList`, `PaintCapture`. Plantilla: `AppShell` (modificada).
- Páginas: `Paints` (nueva). La dependencia sigue solo hacia abajo.

## Datos (Supabase)
Sin cambios: no hay tablas ni migraciones nuevas. "Mis pinturas" usa `paintsStore`/`paintsRepo` existentes.

## Criterios de aceptación
- [x] La barra inferior muestra Recetas · Crear (central, elevado) · Cuenta; el alto sigue siendo 56 px + zona segura (medido 48/56 en 360×640, 390×844 y 360×560; el botón sobresale ~5 px).
- [x] El header tiene ☰ (← en el detalle de receta); ☰ abre el drawer con "Mis pinturas", Recetas, Cuenta y bloque extensible "Próximamente".
- [x] El drawer se cierra con toque afuera, Esc, Atrás del teléfono y arrastrando a la izquierda (tests); Esc y elegir ítem verificados en Chrome. Foco atrapado y devuelto (tests).
- [x] Deslizar desde el borde izquierdo abre el drawer (probado con toques reales en Chrome emulando móvil); se ignora sobre la foto (`data-no-edge-swipe`) para no chocar con el zoom.
- [x] `#/pinturas` permite ver, agregar, editar y borrar pinturas; el asistente conserva su estado (vive en los stores).
- [x] Paso 1 (Rueda) entra sin scroll en 360×640, 390×844 y 360×560. **No re-medido:** paso 1 modo Foto y paso 3 (no se tocó su layout; solo cambió el contenido de la barra superior/inferior, con la misma altura).
- [x] Zonas táctiles: ☰ y las 3 pestañas reciben el toque en su centro (`elementFromPoint`); contraste con los mismos tokens de siempre. Los ítems del drawer miden 44 px.
- [x] Con `prefers-reduced-motion` las animaciones quedan en 0 s (regla global). Sin scroll de página.
- [x] Tests nuevos (navegación, store, haptics, gesto, Drawer, TabBar, AppShell, Paints); `npm test` (533), `npm run lint` y `npm run build` pasan.
- [ ] Pendiente de probar en teléfono real: gesto de borde en iOS Safari (choca con "Atrás" del sistema), PWA instalada, vibración (Android; iOS no vibra).

## Desvíos respecto del plan
- El gesto de borde usa **eventos táctiles en `document`** en vez de una franja o Pointer Events: con Pointer Events Chrome cancelaba el gesto. Por eso no hay `usePanDrawer` sino `useEdgeSwipe`.
- Abrir el drawer por gesto es por umbral (no sigue al dedo); **cerrarlo** arrastrando sí sigue al dedo. El drawer anima la entrada, no la salida.
- Íconos: solo se sumó `menu`; "Mis pinturas" usa `jar`.
- Se agregó `PaintCard`/`PaintList` sin selección (sin `onToggle`) para la pantalla nueva, y `lib/haptics.js`.

## Riesgos y preguntas abiertas
- **iOS Safari:** deslizar desde el borde izquierdo es el gesto "Atrás" del sistema; en la PWA instalada puede competir. Mitigación: el ☰ siempre está disponible y el gesto es un extra.
- El botón central elevado sobresale de la barra: hay que dejar espacio inferior en el contenido para no tapar botones (se mide en 360×560).
- Nombre del botón central: "Crear" (ícono `pot`). ¿Otro?
- **Pregunta:** hoy la barra de pestañas ya está abajo; asumí que lo que querés cambiar es el header (todo arriba) y darle más estilo nativo a la barra. ¿Es así?
- **Pregunta:** ¿"Mis pinturas" solo en el drawer, o también como pestaña (4 pestañas con Crear al medio)?
- **Pregunta:** ¿el drawer entra desde la izquierda con ☰ a la izquierda (recomendado)?
