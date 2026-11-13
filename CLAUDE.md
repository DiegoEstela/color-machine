# Color Machine

App web **mobile-first e instalable (PWA)** para **crear colores mezclando pinturas reales**. Estética de juego pixel art, tema pastel claro (para que los colores del usuario sean lo más saturado de la pantalla). **UI en español rioplatense (voseo)**. El usuario que la construye habla español: responder siempre en español, breve y concreto.

Repo: `github.com/DiegoEstela/color-machine` (rama `main`). Se despliega solo en **Vercel** con cada push. Base de datos y login en **Supabase** (proyecto del usuario; la URL y la clave pública están en su `.env`, que no se versiona).

## Estado actual (leer primero)
**Los 18 specs del plan están implementados y subidos** (ver "Índice de specs"). El ciclo completo funciona: elegir color → elegir pinturas → calcular proporciones → guardar receta → biblioteca. **Lo que NO se pudo comprobar en esta etapa** (solo se verificó con tests y con Chrome simulando un móvil), y que el usuario va a probar en su teléfono:
- Instalación real como app (Android/iPhone) sin cabecera del navegador (spec 011).
- **iPhone/Safari:** que pellizcar la foto no agrande toda la pantalla (spec 010), el teclado con la barra inferior, la hoja ⓘ y la barra de gestos.
- **Supabase real:** guardar/listar recetas y pinturas con su cuenta, y que **otra cuenta no vea esos datos** (RLS). Requiere haber ejecutado `supabase/migrations/0001_init.sql` en el SQL Editor (no hay CLI de Supabase: Xcode viejo impide `brew install supabase`).
- Qué tan parecidos son los colores de referencia (rojo, amarillo, azul, blanco, negro en `referencePaints.js`) a las témperas reales del usuario.

Cuando el usuario traiga feedback de uso real, lo más probable son **ajustes** (tamaños, textos, colores de referencia, espacios). Todo cambio nuevo va como spec nuevo.

## Qué hace la app (flujo del usuario)
1. **Crear → Paso 1, color objetivo:** rueda de color + claridad (con "Ajuste fino" plegable), o foto (cámara/galería) tomando un **punto** o un **recorte** (con zoom). Campo hex editable.
2. **Paso 2, tus pinturas:** lista de "Mis pinturas" (en Supabase), alta con foto + recorte + nombre, o solo nombre + hex. El **consejero** dice qué pinturas base conviene tener para ese color ("la tenés" / "Agregar"). Se eligen de 2 a 6.
3. **Paso 3, tu mezcla:** calcula partes enteras con `spectral.js`. Precisión Simple/Normal/Preciso (6/10/16 partes). Recetas **Recomendada** / **Más exacta**. Si no alcanza, aviso + botones **+ Blanco/+ Negro…** que suman una pintura **estándar** al instante. Botón ⓘ con notas. **Guardar receta** con nombre.
4. **Recetas:** biblioteca, detalle (renombrar, borrar, "Mezclar este color otra vez"). **Cuenta:** email y cerrar sesión.

## Principios (no negociables)
- **Sin IA:** todo el análisis de color es algorítmico (canvas + `culori` + `spectral.js`). No agregar modelos de IA.
- **Escalable:** la lógica vive en `src/features/*` y `src/lib/`, pura y testeada, sin React. Los componentes solo presentan.
- **Atomic design:** `src/components/{atoms,molecules,organisms,templates}` y luego `src/pages`. La dependencia va solo hacia abajo (un átomo no importa moléculas). Un componente por carpeta: `Nombre/Nombre.jsx` + `Nombre.module.css` + `Nombre.test.jsx`; se exporta desde el `index.js` de su nivel.
- **Todo estilo sale de tokens** (`src/styles/tokens.css`): colores, espacios, tamaños, tiempos. Nada de colores sueltos. Las dimensiones propias de un componente (por ejemplo `140px`) sí pueden ir en su CSS.
- **Mobile-first, tipo app:** diseñar para 360×640 y subir; probar también 390×844 y 360×560. Respetar `prefers-reduced-motion` (ya está global en `global.css`).
- **Accesibilidad:** contraste AA (≥ 4.5:1), nombre accesible en todo control, grupos de opciones como `radiogroup` con flechas, foco visible.
- Tests obligatorios para todo lo de `features/` y `lib/`.

## Stack
Vite 8 + React 19 (**JavaScript, sin TypeScript**) · Zustand (estado) · CSS Modules + tokens · Vitest + Testing Library (jsdom) · oxlint · `vite-plugin-pwa` · **Supabase** (`@supabase/supabase-js`) · `culori` (conversiones y ΔE 2000) · `spectral.js` (mezcla de pigmentos Kubelka-Munk, MIT; es CommonJS pero se importa bien con `import { Color, mix } from 'spectral.js'`). **No usar Mixbox** (licencia no comercial). Fuente `@fontsource/press-start-2p` (no bajar de 9 px; el texto largo va en la fuente del sistema).

## Estructura del código
```
src/
  components/{atoms,molecules,organisms,templates}
  pages/        Create (asistente), Paints, RecipeEdit, Library, RecipePage, Account, Auth, Catalog (?catalog=1)
  features/
    auth/        authService, authStore, validation, titles
    color-mixer/ mixer (spectral), solver (+worker, +client), advisor, referencePaints, mixStore
    navigation/  useRoute (rutas por hash)    onboarding/  steps, tour, installHint, onboardingStorage, onboardingStore
    paints/      paintsStore, validation        recipes/  recipesStore, validation, format
    storage/     supabase (cliente + requireUser), createRepo, paintsRepo, recipesRepo, errors
  hooks/        useImageCanvas, usePanZoom
  lib/          color (hex/HSL/promedios), crop, zoom, image
  pwa/          pwaConfig (manifest + service worker)
  styles/       tokens.css, global.css
  test-utils/   photoMocks (jsdom no mide tamaños)
supabase/migrations/0001_init.sql    scripts/generate-icons.mjs    specs/    .claude/commands/
```
- **Átomos:** PixelButton, PixelIconButton, PixelText, PixelPanel (con barra de título), PixelInput, PixelIcon (8×8), PixelJar (frasco), PixelLogo, PixelSparkle, PixelMeter, PixelBar, ColorSwatch. Los dibujos pixel viven en el `grid.js` de cada átomo.
- **Moléculas:** ImproveAdvice, HelpButton, OnboardingArt, PlanAdvice, PartsStepper, EditableRecipeRow, PaintPicker, TweakControl, Drawer, ColorWheel, PhotoPicker, PhotoViewport (zoom), PhotoCropper, PhotoColorPicker, ColorPreview, PaintCard, PaintForm, PaintAdvice, OptionGroup, StepIndicator, TabBar, RecipeRow, ColorCompare, MixingAnimation, InfoSheet, SaveRecipe, RecipeNameForm, RecipeCard, AuthField.
- **Organismos:** OnboardingSheet, RecipeEditor, TweakSheet, TargetColorPicker, PaintsStep, PaintCapture, PaintList, MixResult, RecipeLibrary, RecipeDetail, AuthForm. **Plantilla:** AppShell.

## Estructura de app (pantalla completa)
- Toda pantalla con sesión usa **`AppShell`**: barra superior de **48 px** (☰/atrás, título, pasos), contenido con su propio scroll y **barra de pestañas de 56 px** (Recetas · Crear · Cuenta), más la zona segura del teléfono. **La página nunca hace scroll ni rebota** (`html/body overflow:hidden`, `overscroll-behavior:none`); solo scrollea el contenido. No cambiar el alto de las barras ni agregar scroll de página.
- **Navegación (spec 013):** barra inferior **Recetas · Crear (central, elevado ~5 px) · Cuenta**; la barra superior lleva **☰** (abre el `Drawer`) o ← en el detalle de receta. El `Drawer` (molécula) sale de `features/navigation/menuItems.js` (agregar secciones/ítems ahí; los `disabled` son "próximamente"); estado en `navigationStore`; se cierra con afuera/Esc/Atrás/arrastre y usa `InfoSheet/historyGuard`. Elegir un ítem cierra y **después** navega. Gesto de borde: `hooks/useEdgeSwipe` (eventos táctiles en `document`, ≤16 px del borde; Pointer Events fallaban); ignora `[data-no-edge-swipe]` (la foto).
- **Rutas por hash:** `#/` Crear, `#/recetas`, `#/recetas/<id>`, `#/recetas/<id>/editar`, `#/pinturas` (Mis pinturas, sin pestaña), `#/cuenta`. Cambiar de pestaña **no pierde** el asistente (el estado vive en los stores). La pantalla de acceso no lleva pestañas.
- **Escala compacta:** textos 9–20 px (cuerpo 15 px), bordes 2 px, sombras 3 px. Los botones **se ven de 40 px (34 px los chicos) pero responden como 44 px** con un `::after` invisible. **Al calcular ese `::after`, restar el borde** (`inset` se mide desde el borde interno). Patrón en `PixelButton` y `PixelIconButton`; mantenerlo en controles nuevos (`hitBias="up"` si abajo hay botones pegados).
- El texto de la interfaz no se selecciona (`user-select:none`); los inputs sí. Sin zoom por doble toque (`touch-action: manipulation`).
- **El paso 1 debe entrar sin scroll** (Rueda: 360×640, 390×844, 360×560; Foto: 360×640 y 390×844). Cualquier cambio de tamaño ahí se vuelve a medir.
- **Paso 3 (spec 015):** la "zona del resultado" tiene **alto mínimo de 208 px** (no hay saltos entre mezclando y receta con hasta 3 pinturas); la lista de frasquitos **no tiene scroll propio**: si hay más, scrollea el contenido de la pantalla. `AppShell` lleva un degradé inferior (`useCanScrollMore`) que avisa cuando hay más abajo, y 20 px de aire al final del contenido.

## Mezcla de colores (reglas del dominio)
- `mixer.mixHex(entries)` mezcla con spectral.js; `deltaE` = CIEDE2000. Calidad: ΔE < 2 "Casi idéntico", < 5 "Muy parecido", < 10 "Parecido", ≥ 10 "Aproximado" (`describeQuality`, `qualityLevel` 4–1).
- `solver.solve({target, paints, maxParts, maxPaints})`: enumera recetas de partes enteras **primitivas** (sin 2:2), **máximo 4 pinturas distintas por receta**, ordenadas por ΔE. `recommended` = la de menos partes dentro de ΔE+1 del mejor; `best` = menor ΔE; `alternatives` se calculan pero **la pantalla no las muestra**. Corre en un **Web Worker** (`solver.worker.js`) vía `solverClient` (con respaldo en el hilo principal); jsdom no tiene Worker.
- `advisor`: `adviseBasePaints` (qué bases usar para el objetivo), `matchPaints` (cuáles ya tiene el usuario, ΔE ≤ 30, una pintura no cubre dos bases), `suggestAdditions` (qué sumar si ΔE ≥ 5; mejora ≥ 3 o sube de categoría), `diagnose` (por qué falta: blanco/negro/tono).
- **Pinturas base estándar** (`referencePaints.js`, `standard: true`): Rojo `#e4002b`, Amarillo `#fcd116`, Azul `#1d3fbb`, Blanco `#ffffff`, Negro `#141414`. Ajustarlas ahí si los consejos no se parecen a la realidad.
- **Ajustar (spec 016):** `tweak.js` — `shiftTarget(hex, {light, vivid})` corre la claridad (Lab L ±4 por paso) y el croma (×1,12 por paso) del objetivo; `solve({…, aim})` ordena/elige por la distancia a `aim` pero `deltaE`/`quality` se miden contra el objetivo real (`aimDeltaE` solo existe con `aim`; `rankOf` ordena). `mixStore.tweak` (±3, entra en `resultKey` solo si no es neutro) se reinicia al cambiar de objetivo/`remix`/`reset`. UI: botón "Ajustar" → `TweakSheet` (usa `InfoSheet`, `TweakControl` por eje) + chip "Ajustada: …". `describeNeeds` traduce `diagnose` a "te falta blanco/negro…". La receta guardada es la ajustada (sin migración).
- **Onboarding y ayuda (spec 014):** `features/onboarding/` — `steps.js` (contenido: `TOUR` de 8 tarjetas, `CONTEXT` por pantalla, `helpScreenFor(route, step)`), `tour.js` (`buildTour`, omite "Instalala" si ya está instalada), `installHint.js`, `onboardingStorage.js` (`localStorage` por usuario `cm.onboarding.v1.<id>`, con respaldo en memoria), `onboardingStore.js` (`autoStart` una vez por sesión desde `App.jsx`; cerrar el recorrido lo marca visto, la ayuda por pantalla no; se reinicia al cerrar sesión). `AppShell` monta `OnboardingSheet` (pantalla completa, deslizar con `lib/swipe.js`) y `HelpButton` ("?" de 34 px apoyado sobre la barra, abajo a la derecha). **Al sumar funciones nuevas, actualizar `steps.js`** (tarjetas y ayuda). El menú lateral soporta ítems con `action` (Ayuda).
- **Consejo completo (spec 017):** `advisor.planMissingPaints(target, paints, {maxParts})` prueba sumar 1, 2 y hasta 3 bases que faltan **juntas** (no de a una) y devuelve el conjunto más chico que llega a ΔE < 5 o el que más se acerca: `{ roles, recipe, deltaE, quality, enough }` (`roles` vacío = nada mejora). Tope de 10 partes (con 16 tardaba ~1,5 s). `describePlan` arma la frase ("te faltan: Amarillo y Azul…"). Corre en el Worker (`kind: 'plan'`, `planAsync`) y se guarda en `mixStore.result.plan` junto a `suggestions`. Se muestra con `PlanAdvice` ("Agregar todos") en el paso 3, el panel Ajustar y el selector del editor; con plan, el aviso del paso 3 muestra solo el plan.
- **Para acercarte más (spec 018):** desde **ΔE ≥ 2** (`IMPROVE_DELTA_E`; antes solo ≥ 5) el paso 3 muestra `ImproveAdvice` **entre los frascos y la lista**: abierto/amarillo con ΔE ≥ 5, plegado ("Podría estar más cerca") entre 2 y 5. Contiene: cómo está la mezcla (`describeGap`, ahora con `tone`: tira a rojo/verde/amarillo/azul), qué agregar (`planMissingPaints(…, {threshold: 2})`: con umbral fino elige el conjunto más chico que **sube de categoría**; roles vacíos = lo más cerca que se llega), qué cambiar sin agregar (`suggestPrecision`: 10→16 partes si mejora ≥ 1 ΔE o de categoría; `adviceForTone` con las pinturas de la receta) y `colorFamilyTip` (marrón, gris, oscuro). `mixStore.result` suma `precision` y `adviceReady`. **Un paso de "+1 parte" casi no mejora (medido): la mejora viene de armar otra receta completa con los colores que faltan.** Con solo rojo+amarillo+azul, un marrón oscuro pide negro y uno claro, blanco.
- **Editor de recetas (spec 017):** `features/recipes/editor.js` — borrador `[{name,hex,parts}]` con `editorReducer` (bump/remove/add/lighten/darken/undo/reset/saved; 6 pinturas, 1–20 partes, 30 deshacer). "Más claro/oscuro" = +1 parte de Blanco/Negro estándar. Guardar cambios: `recipesStore.updateMix(id, {mix, result_hex})` (el `target_hex` no cambia; sin migración, RLS `recipes_update_own`); "Guardar como copia": `add`. `hooks/useLeaveGuard` pregunta antes de salir con cambios sin guardar (enlaces `#/`, Atrás, cierre de pestaña).
- Límites: **2–6 pinturas por mezcla** (`MIN/MAX_SELECTED` en `paintsStore`; las sumadas con "+" cuentan); recetas guardadas hasta 12 pinturas en la base (las reales ≤ 4).
- `mixStore` guarda: paso, color objetivo (+ miniatura en memoria), precisión, `recipeKey` (`recommended`|`best`), `result` (con clave `resultKey`: un resultado de otros datos no se muestra), `extraPaints` (estándar sumadas en el paso 3; se descartan al cambiar el objetivo), `savedRecipes` (firma → id, evita duplicar). `reset()` limpia todo.

## Fotos y zoom
- La foto se carga reducida a **1024 px** (`lib/image.js`, respeta EXIF). El color sale **siempre de la foto original**, no de lo que se ve: punto = promedio 5×5; recorte = **promedio recortado** (descarta 10 % más claro y más oscuro; `averageRect`).
- `PhotoViewport` + `usePanZoom` + `lib/zoom.js`: zoom 1–8×, pellizco, un dedo mueve la foto, doble toque (3×/1×), rueda y botones −/×/+. El **marco no cambia de tamaño**; `touch-action:none`, `overscroll-behavior: contain` y bloqueo de los eventos `gesture*` de Safari. Recuadro y mira viven dentro de la foto y usan la variable CSS `--zoom` para no agrandarse. Los toques se miden con `performance.now()` (no `event.timeStamp`) para que los tests sean estables. Arrastrar dentro del recuadro lo mueve; fuera, mueve la foto; con dos dedos siempre se mueve/escala la foto.

## Supabase
- Cliente único en `src/features/storage/supabase.js` (`null` si faltan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; la app muestra un aviso). **Nunca versionar `.env` ni claves `service_role`/secret.**
- Tablas `paints` (name, hex) y `recipes` (name, target_hex, result_hex, `mix` jsonb = copia `[{name, hex, parts}]`), con **RLS por `auth.uid()`**; `owner_id`/`created_at` los pone la base y el rol `anon` no tiene permisos. **Login con email + contraseña** (confirmación de email; sin sesiones anónimas). Cambios de esquema: SQL numerado en `supabase/migrations/`, que el usuario pega en el SQL Editor.
- La app accede a datos **solo** vía `features/storage/*` (`createRepo` devuelve siempre `{data, error}`), nunca desde un componente. Errores de red → `errors.js` (`isNetworkError`, `offlineError`): "Sin conexión. Revisá tu internet…".
- No llamar a Supabase dentro del callback de `onAuthStateChange`. Al cerrar sesión (`SIGNED_OUT`) `authStore` vacía mixStore, paintsStore y recipesStore.

## PWA (app instalable)
- Config en `src/pwa/pwaConfig.js` → `vite.config.js`. `display: standalone`, tema lavanda `#cdb4db`. El service worker **no corre en desarrollo**: probarlo con `npm run build && npx vite preview`.
- **Nunca cachear Supabase** (datos ni sesión): lo que no es del propio origen va `NetworkOnly`. Las versiones nuevas se instalan en segundo plano y se activan al **abrir la app de nuevo** (`registerType: 'prompt'` sin avisar, para no recargar en medio de una mezcla).
- Íconos en `public/icons/` generados desde el logo con `npm run icons` (Chrome sin interfaz, sin dependencias; regenerar si cambia el logo o el color de la barra). `vercel.json` fija las cabeceras de caché.
- Un acceso directo viejo a la pestaña del navegador se ve con barra y tres puntos: para ver la app de verdad hay que **instalarla** ("Instalar aplicación" / Compartir → Agregar a inicio).

## Flujo de trabajo con specs (cómo trabajamos)
1. `/spec <tarea>` → investiga y escribe `specs/NNN-nombre.md` (desde `specs/_template.md`) en estado `borrador`. **No toca código.** Termina con un resumen y preguntas.
2. El usuario aprueba ("aprobado", "con las opciones propuestas") o pide cambios → pasa a `aprobado`. Si cambia de idea, se actualiza el spec o se crea uno nuevo.
3. `/implement NNN` → implementa **solo** lo del spec, con tests; corre `npm test`, `npm run lint` y `npm run build`; marca los criterios cumplidos con honestidad (los que no se pudieron comprobar quedan explicados) y pasa el estado a `implementado`. **No hace commit.**
4. `/ship` → revisa estado/diff/secretos, corre tests y build, **muestra resumen y mensaje de commit y espera confirmación explícita** ("sí, confirmo") antes de `git commit` y `git push`.
- **Nunca implementar sin spec aprobado.** Trabajo nuevo = spec nuevo (el siguiente número es **019**).
- Al terminar cada implementación: resumen corto de qué cambió, qué se midió y **qué falta probar en el teléfono**.

## Git y commits
- Rama `main`; push directo con `git push` (las credenciales ya están guardadas; `gh` no está instalado). Identidad local del repo: Diego Estela.
- Mensajes en inglés, imperativo: `Implement spec NNN: …` con un cuerpo breve. Terminar con la línea `Co-Authored-By:` que indique el entorno.
- **`.env.example` está vacío (0 bytes) por decisión del usuario y se EXCLUYE de todos los commits** (`git add -A -- . ':!.env.example'`). Si pide restaurarlo: `git checkout -- .env.example` (queda con `VITE_SUPABASE_URL=` y `VITE_SUPABASE_ANON_KEY=` vacíos). Antes de cada commit, escanear que no haya `sb_publishable`, `sb_secret` ni JWT en lo que se sube.

## Cómo verificar (lo que hicimos y funciona)
- **Siempre** `npm test` (desde la raíz del proyecto, no desde `src/`), `npm run lint` y `npm run build`.
- **Medir en Chrome real** (hay Google Chrome en macOS; no hay Playwright): se arma un harness temporal en `.harness/` (index.html + main.jsx que monta `<App/>` o el componente con stores precargados, y `vite.config.js` con `root` absoluto y `preview.port 5198`), se compila (`npx vite build -c .harness/vite.config.js`), se sirve (`npx vite preview -c …`) y un script Node abre Chrome con `--headless=new --remote-debugging-port` y habla CDP por `WebSocket` (Node 22). Emulación móvil con `Emulation.setDeviceMetricsOverride` + `setTouchEmulationEnabled` (reenviarlo después de `Page.navigate` si hace falta), zona segura con `Emulation.setSafeAreaInsetsOverride`, movimiento reducido con `Emulation.setEmulatedMedia`, pellizcos con `Input.synthesizePinchGesture`, toques con `Input.dispatchTouchEvent`, capturas con `Page.captureScreenshot` (para verlas, leer el PNG). Instalabilidad con `Page.getInstallabilityErrors`. Medir: alto de barras, `main.scrollHeight - clientHeight`, scroll de página, `visualViewport.scale`, zonas táctiles con `elementFromPoint`. **Borrar `.harness/` al terminar** (nunca se versiona). Los scripts auxiliares viven en el scratchpad de la sesión, no en el repo.
- Para cambios visuales: capturas "antes y después" a 360×640 y mostrarle al usuario qué cambió.

## Trampas conocidas
- zsh: para separar argumentos de una variable usar `${=var}`; no existe `timeout`.
- Vitest: correr desde la raíz (desde `src/` falla la configuración). jsdom no mide tamaños (usar `test-utils/photoMocks`) y sí tiene `PointerEvent`; `history.back()` es asíncrono y `history.state` devuelve una **copia** en los navegadores (comparar por valor). Reloj de toques: `vi.useFakeTimers({ toFake: ['performance'] })`.
- CSS Modules localiza los nombres de `@keyframes`: definirlos en el mismo módulo donde se usan.
- Posicionamiento absoluto: `inset`/`top`/`bottom` se miden desde el borde interno (padding box); restar el borde.
- Un `::after` de zona táctil dentro de un contenedor con `overflow` se recorta en sus bordes: dejar `padding` ahí.
- `solveAsync` usa Worker; en tests cae al hilo principal (con `setTimeout 0`).

## Índice de specs (todos implementados)
| Spec | Qué hizo |
|---|---|
| 001 | Tokens pastel, tema pixel y átomos |
| 002 | Tablas `paints`/`recipes` con RLS y repositorios |
| 003 | Login con email y contraseña |
| 004 | Paso 1: color objetivo (rueda, foto, punto/recorte) |
| 005 | Paso 2: pinturas, etiquetas y recorte de fotos |
| 006 | Paso 3: solver con spectral.js, consejero de pinturas, animación |
| 007 | Layout compacto (paso 1 sin scroll) |
| 008 | Estética retro (logo, frascos, ventanas) y explicaciones del paso 3 |
| 009 | App a pantalla completa: AppShell, pestañas, recetas guardadas, biblioteca, escala compacta |
| 010 | Zoom y desplazamiento dentro de la foto |
| 011 | PWA instalable, íconos, service worker, errores de red |
| 012 | Paso 3 compacto y sumar el color sugerido al instante |
| 013 | Navegación nativa: barra con Crear central, ☰ + menú lateral (drawer), Mis pinturas (`#/pinturas`), gesto de borde |
| 014 | Onboarding de 8 tarjetas la primera vez, botón "?" de ayuda por pantalla, ítem Ayuda en el menú |
| 015 | Paso 3 con scroll natural: zona de resultado con alto mínimo, lista sin scroll propio, degradé "hay más abajo" |
| 016 | Ajustar la mezcla: Luz e Intensidad (±3 pasos) con panel, y qué sumar |
| 017 | Editar recetas guardadas (`#/recetas/<id>/editar`) y consejo completo de colores (`planMissingPaints`) |
| 018 | "Para acercarte más": banner con qué agregar / qué cambiar desde ΔE 2 (plan fino, precisión mayor, tono, consejo de marrones) |

## Ideas posibles (no especificadas todavía)
Calculador de cantidades ("quiero 100 ml"), búsqueda y filtros en la biblioteca, compartir/exportar recetas, calibrar con la mezcla real del usuario, volver a mostrar recetas alternativas, subir el límite de resolución de la foto, botón "Instalar app" dentro de Cuenta, paginación de recetas, modo oscuro, login con Google.

## Comandos
`npm run dev` · `npm run build` · `npm run preview` · `npm test` · `npm run lint` · `npm run icons`
