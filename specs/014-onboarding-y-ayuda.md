# 014 — Onboarding guiado y ayuda siempre a mano

- **Estado:** implementado (medido en Chrome con emulación móvil y tests; falta probarlo en un teléfono real)
- **Fecha:** 2026-11-13

## Objetivo
Que alguien que abre la app por primera vez entienda en ~1 minuto qué hace y cómo usarla, y que pueda **volver a ver la ayuda cuando quiera** con un ícono de ayuda siempre visible abajo.

Hoy no hay ninguna explicación fuera de la hoja ⓘ del paso 3. Cosas que no son obvias: elegir un color desde una foto (punto vs recorte, zoom), que "Mis pinturas" y el menú viven en el ☰, qué significan "Recomendada" / "Más exacta", el "+ Blanco / + Negro", y que la app se puede instalar.

## Alcance
- Incluye:
  - **Recorrido de bienvenida** (pantalla completa, sobre la app) la **primera vez** que el usuario entra con sesión. Se saltea con "Omitir" en cualquier momento.
  - **8 tarjetas** (una idea por tarjeta, ilustración pixel + 2–3 líneas, voseo):
    1. Bienvenida: "Creá cualquier color mezclando tus pinturas reales."
    2. **Elegí tu color:** rueda y claridad, o foto (punto o recorte), zoom con pellizco / doble toque / botones.
    3. **Tus pinturas:** agregarlas con foto o hex, el consejero ("la tenés" / "Agregar"), elegir de 2 a 6.
    4. **Tu mezcla:** partes enteras, precisión Simple/Normal/Preciso, **Recomendada vs Más exacta**, calidad ("Casi idéntico"…) y el botón ⓘ.
    5. **Si no alcanza:** la app te dice **todos los colores que faltan** ("te faltan: Amarillo y Azul") y **Agregar todos** los suma de una; y **Ajustar** para hacerla más clara/oscura o más intensa/apagada.
    6. **Guardá y mejorá tus recetas:** Guardar receta, Recetas, **Editar mezcla** (± partes, Más claro / Más oscuro, sumar otro color, deshacer, guardar cambios o como copia) y "Mezclar este color otra vez".
    7. **Menú y Mis pinturas:** el botón ☰ (o deslizar desde el borde izquierdo) abre el menú con **Mis pinturas**, Recetas y Cuenta; el botón **Crear** del centro empieza una mezcla nueva.
    8. **Instalala:** cómo agregarla a la pantalla de inicio (texto distinto Android / iPhone; se omite si ya está instalada, `display-mode: standalone`).
  - **Ícono de ayuda "?" siempre visible** (ver decisión abajo) que reabre el recorrido, más un **ítem "Ayuda" en el menú lateral** y un botón "Ver el recorrido de nuevo" en Cuenta.
  - **Ayuda por pantalla (contextual):** al tocar el "?" se abre primero la tarjeta de la pantalla actual (Crear paso 1/2/3, **panel Ajustar**, Recetas, detalle de receta, **Editar mezcla**, Mis pinturas, Cuenta) y desde ahí se puede seguir al recorrido completo. Así el "?" sirve de verdad dentro de cada paso.
  - Navegación del recorrido: Siguiente / Atrás, puntos de progreso, deslizar izquierda/derecha, Esc, botón Atrás del teléfono (cierra), foco atrapado, `role="dialog"`.
  - Recordar que ya lo vio.
- No incluye: tutorial interactivo con resaltado de elementos reales ("coach marks"), videos, analytics, traducciones, tabla nueva en Supabase.

## Decisión de diseño: dónde va el ícono de ayuda (opciones)
- **A (recomendada): botón "?" flotante pequeño pegado a la barra inferior, esquina inferior derecha**, a la altura del botón central Crear pero del lado opuesto a ☰. Ventajas: visible en todas las pantallas, no ocupa una pestaña ni cambia el alto de la barra (56 px). Se ve de 34 px y responde como 44 px (`PixelIconButton`, patrón `::after`). Se oculta cuando hay un diálogo abierto. Riesgo: puede tapar contenido en la esquina → el contenido ya tiene margen inferior y se mide en 360×560.
- B: cuarta pestaña "Ayuda" en la barra. Rompe la simetría con Crear al centro (4 ítems) y la ayuda no es un destino.
- C: solo en el drawer. Es lo menos visible: no cumple "siempre a mano".
Se implementa A + el ítem del drawer + el botón de Cuenta (las tres entradas abren lo mismo).

## Dónde se guarda "ya lo vio"
- **Recomendado: `localStorage` por usuario** (clave `cm.onboarding.v1.<user.id>`), con `try/catch` (si falla, se muestra una sola vez por sesión). Sin cambios de esquema, funciona offline y es instantáneo. Contra: en otro dispositivo o navegador vuelve a aparecer una vez.
- Alternativa: tabla `profiles` en Supabase con `onboarding_seen_at` (migración `0002_profiles.sql` + RLS). Se sincroniza entre dispositivos, pero agrega tabla, red al arrancar y un parpadeo posible. Se puede hacer después si molesta repetirlo.
- La versión (`v1`) permite volver a mostrarlo si más adelante se agregan funciones grandes.
- Al cerrar sesión no se borra (es una preferencia del usuario en ese dispositivo).

## Plan
1. **Contenido como datos** (`features/onboarding/steps.js`): lista de tarjetas `{ id, title, body[], art, screen }` + mapa `contextHelp` por ruta/paso. Todo el texto en un solo lugar.
2. **Lógica pura con tests** (`features/onboarding/`):
   - `onboardingStorage.js`: `hasSeen(userId)`, `markSeen(userId)` con `try/catch` y clave versionada.
   - `onboardingStore.js` (zustand): `open`, `mode: 'tour' | 'context'`, `index`, `start()`, `startContext(route, step)`, `next()`, `prev()`, `finish()` (marca visto), `skip()`.
   - `installHint.js`: detecta standalone / iOS / Android para la tarjeta 7.
3. **Disparo automático:** en `App.jsx`, cuando `status === 'signedIn'` y no vio el onboarding → `start()` una vez. No se muestra en la pantalla de acceso, ni en `?catalog=1`, ni durante recuperación de contraseña.
4. **`OnboardingSheet` (organismo):** pantalla completa con ilustración, título, texto, puntos de progreso y botones Omitir / Atrás / Siguiente (último: "¡Empezar!"). Deslizar para cambiar de tarjeta (umbral, sin seguir al dedo). Entra con el mismo estilo de animación; respeta `prefers-reduced-motion`. Atrás del teléfono lo cierra (patrón `historyGuard`).
5. **Ilustraciones:** `OnboardingArt` (molécula) dibuja mini escenas pixel con átomos existentes (`PixelJar`, `PixelIcon`, `ColorSwatch`, `PixelLogo`, `PixelSparkle`) para no agregar imágenes. Los íconos nuevos que falten (`help`, `hand`) van en `PixelIcon` (8×8).
6. **Botón de ayuda:** molécula `HelpButton` (usa `PixelIconButton`, ícono `help`, nombre accesible "Ayuda") montada en `AppShell` sobre la barra inferior; abre la ayuda contextual. `AppShell` recibe la ruta/paso por `useRoute`/`mixStore`.
7. **Entradas extra:** ítem "Ayuda" en `menuItems.js` (acción en vez de `href`: el Drawer necesita soportar ítems con `onSelect`) y botón en `Account`.
8. **Verificación** en Chrome móvil (harness temporal, luego borrar): 360×640, 390×844, 360×560, con safe-area; el sheet entra sin scroll en cada tarjeta, el "?" no tapa controles ni se superpone con Crear/pestañas, zonas táctiles, reduced-motion, y que el paso 1 sigue sin scroll.
9. Actualizar `CLAUDE.md` (estructura, índice de specs, "falta probar en teléfono").

## Archivos a crear/modificar
- `src/features/onboarding/{steps.js, onboardingStorage.js, onboardingStore.js, installHint.js}` + tests — contenido, persistencia, estado, detección de instalación.
- `src/components/atoms/PixelIcon/icons.js` — íconos `help` (+ los que falten).
- `src/components/molecules/OnboardingArt/` — ilustraciones pixel por tarjeta.
- `src/components/molecules/HelpButton/` — botón "?".
- `src/components/molecules/Drawer/*` y `features/navigation/menuItems.js` — ítems con acción (`onSelect`).
- `src/components/organisms/OnboardingSheet/` — el recorrido (diálogo a pantalla completa).
- `src/components/templates/AppShell/*` — monta `HelpButton` y `OnboardingSheet`.
- `src/pages/Account/Account.jsx` — "Ver el recorrido de nuevo".
- `src/App.jsx` — disparo automático la primera vez.
- `src/styles/tokens.css` — tokens nuevos si hacen falta (`--help-size`, tiempos).
- `CLAUDE.md`, este spec.

## Atomic design
- Átomos: `PixelIcon` (ícono `help`), reutiliza `PixelButton`, `PixelIconButton`, `PixelText`, `PixelJar`, `PixelSparkle`, `ColorSwatch`.
- Moléculas: **`HelpButton`**, **`OnboardingArt`**, `Drawer` (ítems con acción).
- Organismos: **`OnboardingSheet`**. Plantilla: `AppShell` (monta ambos).
- La dependencia sigue solo hacia abajo; el contenido y la lógica viven en `features/onboarding`, sin React.

## Datos (Supabase)
Sin cambios: no hay tablas ni migraciones. El estado "visto" va en `localStorage` por usuario. (Si se prefiere sincronizar entre dispositivos: `profiles(owner_id, onboarding_seen_at)` con RLS por `auth.uid()` en `supabase/migrations/0002_profiles.sql`, que pegarías en el SQL Editor.)

## Criterios de aceptación
- [x] La primera vez que una cuenta entra se muestra el recorrido de 8 tarjetas (7 si la app ya está instalada); al terminarlo u omitirlo no vuelve a aparecer (medido en Chrome: recarga sin recorrido, `localStorage` con `cm.onboarding.v1.<id>`).
- [x] No aparece en la pantalla de acceso, en recuperación de contraseña ni en el catálogo (test de `App`); cada usuario lo ve una vez (clave por usuario) y al cerrar sesión se reinicia para el próximo.
- [x] El "?" es visible en todas las pantallas con barra inferior, apoyado sobre el borde de la barra a la derecha (34 px visibles, 10 px sobre la barra); la barra sigue en 48/56, no tapa Crear ni el centro de Cuenta (`elementFromPoint`), y no cambia el scroll del contenido ni de la página.
- [x] Tocar el "?" abre la ayuda de la pantalla actual (Crear paso 1, 2 o 3, Recetas, detalle de receta, Editar mezcla, Mis pinturas, Cuenta) con "Ver el recorrido completo"; también se abre desde "Ayuda" en el menú ☰ y desde "Ver el recorrido de nuevo" en Cuenta.
- [x] Se navega con Siguiente / Atrás, puntos, deslizar de lado (probado con toques reales), flechas y Esc; el botón Atrás del teléfono lo cierra; foco atrapado y devuelto; `role="dialog"` con nombre accesible.
- [x] Cada tarjeta entra **sin scroll** a 360×640, 360×560 y 390×844 (medido tarjeta por tarjeta).
- [x] La tarjeta "Instalala" cambia el texto según iPhone / Android / otro y se omite con la app instalada (tests de `detectInstall` y `buildTour`).
- [x] Textos en voseo; las ilustraciones y los puntos son decorativos (`aria-hidden`); animación de entrada con tokens y `prefers-reduced-motion` (regla global).
- [x] Si `localStorage` falla, la app sigue funcionando y lo recuerda mientras está abierta (test).
- [x] Tests de `features/onboarding/*`, `swipe`, `OnboardingSheet`, `OnboardingArt`, `HelpButton`, `Drawer` con acciones, `AppShell`, `App` y menú; `npm test` (735), `npm run lint` y `npm run build` pasan.
- [ ] Pendiente de probar en teléfono real: deslizar entre tarjetas en iPhone, las instrucciones de instalación reales (Android e iPhone) y el "?" con la barra de gestos.

## Desvíos respecto del plan
- **Ayuda del panel "Ajustar":** el "?" queda detrás del panel cuando hay un diálogo abierto, así que Ajustar se explica en la tarjeta 5 del recorrido y en la ayuda del paso 3 (no tiene tarjeta propia).
- El estado del onboarding vive en `onboardingStore` y **`AppShell` monta el recorrido**; el disparo automático está en `App.jsx` (una vez por sesión y por usuario).
- El gesto de deslizar se factorizó en `lib/swipe.js` (`swipeDirection`), compartido con el gesto de borde del menú.
- El menú lateral soporta ítems con **acción** (además de enlaces); "Ayuda" abre el recorrido después de cerrar el menú (espera al `history.back()` del menú).
- Con el recorrido abierto, el gesto de borde del menú se desactiva.

## Riesgos y preguntas abiertas
- 8 tarjetas pueden parecer largas: se mitiga con "Omitir" siempre visible y la ayuda contextual para no depender del recorrido.
- Textos de instalación de iOS/Android cambian con las versiones del sistema: se redactan genéricos ("Compartir → Agregar a inicio", "Instalar aplicación").
- `localStorage` no sincroniza entre dispositivos (ver Datos).
- El "?" flotante en la esquina inferior derecha puede competir con botones de fin de pantalla (p. ej. "Siguiente" en el paso 1): se verifica en 360×560 y, si molesta, sube unos px o se esconde en esos pasos.
- **Preguntas:**
  1. ¿Ubicación del "?": opción **A** (flotante abajo a la derecha, recomendada)?
  2. ¿Guardamos "visto" en `localStorage` (recomendado) o en Supabase por cuenta?
  3. ¿Te sirven las 8 tarjetas propuestas (ahora incluyen el consejo de colores, Ajustar, Editar mezcla y el menú), o querés más cortas (p. ej. 6, uniendo 5+6 y 7+8)?
  4. ¿La ayuda contextual por pantalla te parece bien, o solo el recorrido completo?
