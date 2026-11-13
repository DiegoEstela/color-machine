# 009 — Guardar recetas, biblioteca y navegación estilo app

- **Estado:** implementado (verificado en Chrome con emulación móvil y tests; falta probarlo en un teléfono y contra Supabase real)
- **Fecha:** 2026-11-14

## Objetivo
1. Cerrar el ciclo: guardar una mezcla con **nombre** y volver a verla en una **biblioteca de recetas**, sin repetir todo el proceso.
2. Que la app se sienta **una app de celular**: pantalla completa, **barra de pestañas abajo** (Crear · Recetas · Cuenta) y barra superior compacta, en lugar de una ventana flotante con márgenes.
3. Que **se comporte como una app instalada** (junto con el spec 011, que la hace instalable): el scroll ocurre solo dentro del contenido, sin rebote de página ni "tirar para actualizar", sin selección de texto accidental, con las barras de arriba y abajo siempre del mismo alto, y con **todo un poco más chico** para que se vea más prolijo.

## Decisiones del usuario (ya tomadas)
- Navegación **estilo app** (barra inferior, pantalla completa).
- El campo de nombre al guardar **empieza vacío** (sin nombre sugerido).
- Se **incluye** "Mezclar este color otra vez".

## Alcance
- Incluye:
  - **Comportamiento de app:** la página no hace scroll; solo el área de contenido (con `overscroll-behavior: none`, sin rebote ni recarga al tirar hacia abajo); el texto de la interfaz no se selecciona ni muestra el menú de pulsación larga (sí los campos de texto); sin zoom por doble toque; sin resaltado azul al tocar; zona segura arriba (barra de estado) y abajo (barra de gestos).
  - **Alturas estables:** barra superior de **48 px** y barra inferior de **56 px** (más la zona segura) en todas las pantallas; el área de contenido siempre es el resto de `100dvh`, de modo que ninguna pantalla "salta" de alto al cambiar de paso, de pestaña o de contenido.
  - **Escala compacta (~15 % más chica):** textos, espacios, bordes (3 → 2 px), sombras (4 → 3 px), frascos y botones; los botones se ven de ~40 px pero **mantienen una zona táctil de 44 px**.
  - **Estructura de app (`AppShell`)**: barra superior compacta (título del paso o pantalla, indicador de pasos con íconos chicos cuando se está creando), contenido a pantalla completa (sin la ventana con borde y sombra) y **barra de pestañas inferior** con zona segura para el borde del iPhone. Sin márgenes laterales de más; los paneles pixel quedan dentro del contenido.
  - **Pestañas**: *Crear* (el asistente de 3 pasos), *Recetas* (biblioteca y detalle) y *Cuenta* (email del usuario y botón "Cerrar sesión"; el ícono de salir sale de la barra superior).
  - **Guardar** desde el paso 3: botón "Guardar receta" en cada receta mostrada (recomendada, más exacta u otras) con un formulario de nombre **vacío**. Confirmación "¡Receta guardada!" con un acceso a *Recetas*; el botón queda en "Guardada" y no se duplica.
  - **Biblioteca**: de la más nueva a la más vieja, con los dos frascos (color buscado y resultado), nombre, resumen de partes ("2 Rojo · 1 Azul") y fecha. Estados de carga, error con "Reintentar" y vacío con botón "Crear una mezcla".
  - **Detalle**: nombre, comparación con el medidor de parecido, partes por pintura, nota de "1 parte" y acciones: **Renombrar**, **Borrar** (con confirmación) y **Mezclar este color otra vez** (usa el color buscado como objetivo y lleva al paso 2).
  - **Rutas por hash** por debajo (`#/`, `#/recetas`, `#/recetas/<id>`, `#/cuenta`): el botón Atrás del teléfono vuelve entre pantallas y la pestaña activa se resalta. Cambiar de pestaña **no pierde lo que se estaba creando** (el color, las pinturas elegidas y el resultado viven en los stores).
  - Vaciar recetas de memoria al cerrar sesión.
- No incluye: cantidades en ml o gotas, búsqueda o filtros, compartir o exportar, etiquetas o carpetas, editar las partes de una receta guardada, fotos de las recetas, modo sin conexión, cambiar de cuenta o editar el perfil.

## Plan
1. **Medir primero** (Chrome con emulación móvil, 360x640 / 390x844 / 360x560): cuánto alto queda hoy en el paso 1 (Rueda y Foto) para saber cuánto le quita la barra inferior (~56 px más la zona segura) y cuánto se recupera al eliminar el borde, la sombra y los márgenes de la ventana.
2. **Navegación** (`features/navigation/useRoute.js`): hook sobre `location.hash` que expone `{ route, navigate }` (`create`, `library`, `recipe/:id`, `account`) y escucha `hashchange`. Sin dependencias nuevas.
3. **Comportamiento de app y escala compacta** (`styles/global.css` y `tokens.css`): `html`, `body` y `#root` a `100dvh` sin scroll de página; contenedor de contenido con `overflow-y: auto`, `overscroll-behavior: none` y `-webkit-overflow-scrolling: touch`; `user-select: none` salvo en `input`/`textarea`; `-webkit-touch-callout: none`; `touch-action: manipulation`; `env(safe-area-inset-*)` arriba y abajo. Tokens: `--bar-top: 48px`, `--bar-bottom: 56px`, escala tipográfica y de espacios reducida ~15 %, `--border-w: 2px`, `--shadow-step: 3px`, y zona táctil de 44 px con `::after` en los botones.
4. **Plantilla `AppShell`** (reemplaza a `WizardLayout`): barra superior (título + acción opcional como "Atrás" en el detalle; en *Crear* lleva el `StepIndicator` compacto, solo íconos), área de contenido que ocupa el resto de `100dvh` con scroll interno cuando haga falta (el paso 1 debe entrar sin scroll) y `TabBar` inferior.
5. **Molécula `TabBar`**: `<nav>` con tres enlaces (`<a href="#/...">`) con ícono y nombre, de >= 44 px (56 px de alto) y `aria-current="page"` en la activa. Íconos nuevos: `book` (Recetas) y `user` (Cuenta); *Crear* usa `pot`.
6. **Datos** (`features/recipes/`):
   - `validation.js`: `validateRecipeName(name)` (1 a 60 caracteres, igual que la base) y `toRecipePayload({ name, targetHex, recipe })` → `{ name, target_hex, result_hex, mix: [{ name, hex, parts }] }`.
   - `recipesStore.js` (Zustand, como `paintsStore`): `recipes`, `status`, `error`, `load()`, `add(payload)`, `rename(id, name)`, `remove(id)`, `reset()`. Usa `recipesRepo` del spec 002.
7. **Paso 3** (`MixResult`): cada receta tiene "Guardar receta" → panel con `RecipeNameForm` → guardar → confirmación. Se recuerda en memoria (objetivo + partes) qué recetas ya se guardaron para no duplicar. Error de red: mensaje en español y reintentar.
8. **Pantallas nuevas**: `Library`, `RecipePage` y `Account`; moléculas `RecipeCard` y `RecipeNameForm`; organismos `RecipeLibrary` y `RecipeDetail`.
9. `mixStore`: acción para empezar desde un color ("Mezclar otra vez": fija el objetivo, vacía el resultado y va al paso 2). `authStore`: vaciar `recipesStore` al cerrar sesión.
10. **Verificar en Chrome** a 360x640, 390x844 y 360x560: scroll del paso 1 (Rueda y Foto), barra inferior sin tapar contenido, formulario de guardado, biblioteca con y sin recetas, detalle y cuenta; y con `prefers-reduced-motion`.
11. Tests, `npm test`, `npm run lint`, `npm run build`.

## Archivos a crear/modificar
- `src/features/navigation/useRoute.js` (+ test)
- `src/features/recipes/validation.js`, `recipesStore.js` (+ tests)
- `src/components/templates/AppShell/` (reemplaza `WizardLayout/`) (+ tests)
- `src/components/molecules/TabBar/`, `RecipeCard/`, `RecipeNameForm/` (+ tests)
- `src/components/organisms/RecipeLibrary/`, `RecipeDetail/`, `MixResult` (guardar) (+ tests)
- `src/components/molecules/StepIndicator/` (variante compacta)
- `src/components/atoms/PixelIcon/icons.js` (`book`, `user`)
- `src/pages/Library/`, `RecipePage/`, `Account/`, `Create/Create.jsx`, `Auth/` (la pantalla de acceso no lleva barra de pestañas)
- `src/features/color-mixer/mixStore.js`, `src/features/auth/authStore.js`, `src/App.jsx`
- `src/styles/tokens.css` (altura de la barra inferior y zona segura)

## Atomic design
- Átomos reutilizados: `PixelButton`, `PixelText`, `PixelPanel`, `PixelInput`, `PixelJar`, `PixelMeter`, `PixelSparkle`, `PixelIcon`, `PixelLogo`.
- Moléculas nuevas: `TabBar`, `RecipeCard`, `RecipeNameForm`; reutilizadas: `ColorCompare`, `RecipeRow`, `StepIndicator`.
- Organismos nuevos: `RecipeLibrary`, `RecipeDetail`. Plantilla nueva: `AppShell`. Páginas nuevas: `Library`, `RecipePage`, `Account`.
- Navegación, validación y datos viven en `features/`, no en los componentes.

## Datos (Supabase)
**Sin cambios de esquema**: se usa la tabla `recipes` del spec 002 con sus políticas RLS (cada usuario solo ve y modifica las suyas). Requiere la migración `0001_init.sql` ejecutada y sesión iniciada.
- **Escritura** (`recipesRepo.create`): `{ name, target_hex, result_hex, mix }`. `owner_id` y `created_at` los fija la base.
- **`mix`** es una **copia** de la receta: `[{ "name": "Rojo", "hex": "#e4002b", "parts": 2 }, ...]` (hasta 4 pinturas por receta; la base admite 12). Si después se edita o borra una pintura, la receta guardada no cambia.
- **Renombrar** (`update`): solo `name`. **Borrar** (`remove`): definitivo.
- **Lectura**: `list` por `created_at desc` (índice `recipes_owner_created_idx`). El ΔE y la calidad no se guardan: se calculan al mostrar.
- Validaciones del cliente iguales a las de la base: nombre de 1 a 60 caracteres, hex `#RRGGBB`, `mix` de 1 a 12 elementos con partes enteras >= 1.

## Criterios de aceptación
- [x] La app ocupa toda la pantalla: barra superior compacta, contenido y barra de pestañas inferior fija (con zona segura en iPhone); no hay ventana flotante con borde y sombra.
- [x] La página no hace scroll ni rebota: solo el área de contenido; no hay "tirar para actualizar"; el texto de la interfaz no se selecciona (los campos sí) y no hay zoom por doble toque (medido y probado con emulación táctil en Chrome).
- [x] La barra superior mide siempre 48 px y la inferior 56 px (más zona segura) en todas las pantallas y pasos; el área de contenido ocupa el resto y no cambia de alto al navegar (medido en Chrome).
- [x] Textos, espacios, bordes, sombras, frascos y botones son ~15 % más chicos que ahora, con zonas táctiles de >= 44 px (verificado midiendo el área clicable).
- [x] Las tres pestañas (Crear, Recetas, Cuenta) funcionan, la activa se resalta y tienen >= 44 px; cambiar de pestaña no pierde el color, las pinturas elegidas ni el resultado en curso.
- [x] El botón Atrás del teléfono o del navegador vuelve entre pantallas; abrir `#/recetas` o `#/recetas/<id>` directo funciona con sesión; un id inexistente muestra un aviso y una salida.
- [x] El paso 1 sigue sin scroll con la barra inferior: Rueda en 360x640, 390x844 y 360x560; Foto en 360x640 y 390x844 (medido en Chrome).
- [x] En el paso 3 se guarda la receta mostrada con un nombre (probado con tests que verifican el contenido exacto enviado a Supabase: `name`, `target_hex`, `result_hex` y `mix`; la fila real en tu base se confirma al probarlo con tu cuenta); en Supabase queda una fila con `name`, `target_hex`, `result_hex` y `mix`. El campo de nombre empieza vacío; vacío o de más de 60 caracteres se rechaza con mensaje.
- [x] Tras guardar se ve la confirmación con acceso a *Recetas* y el botón de esa receta queda en "Guardada"; otra receta distinta sí se puede guardar.
- [x] La biblioteca muestra frascos, nombre, partes y fecha de la más nueva a la más vieja, con estados de carga, error con "Reintentar" y vacío.
- [x] El detalle muestra la comparación con el medidor, las partes por pintura y la nota de "1 parte".
- [x] Renombrar y borrar (con confirmación) funcionan desde la biblioteca y el detalle; un error de red se muestra en español sin perder la pantalla.
- [x] "Mezclar este color otra vez" lleva al paso 2 con ese color como objetivo.
- [x] *Cuenta* muestra el email y cierra la sesión; al cerrar sesión no quedan recetas, pinturas ni resultados en memoria.
- [ ] Otra cuenta no ve mis recetas (RLS). **Pendiente:** depende de las políticas del spec 002 en tu Supabase; se comprueba entrando con dos cuentas.
- [x] Sin scroll horizontal a 360 px; objetivos táctiles >= 44 px; sin animaciones con `prefers-reduced-motion`; contraste AA.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Alto disponible.** La barra inferior (~56 px) compite con el paso 1; se compensa quitando márgenes y el borde de la ventana y metiendo el indicador de pasos en la barra superior. Si aun así no entra a 360x640 en la pestaña Foto, se ajustan los tamaños y se vuelve a medir antes de dar el spec por cerrado.
- **Estado local al cambiar de pestaña.** El color, las pinturas elegidas y el resultado se conservan; lo que vive solo en el componente (qué pestaña Rueda/Foto estaba abierta, la foto cargada) se pierde al salir y volver.
- **Teclado en iPhone.** Cuando se abre el teclado, la barra inferior puede subir; se prueba en un teléfono real.
- **Borrado definitivo.** No hay papelera; se pide confirmación.
- **Hash en la URL.** Evita configurar redirecciones en Vercel y da el botón Atrás; la URL es menos prolija.
- **Una receta guardada es una foto del momento**: no cambia si después se edita una pintura.
- **Lista larga.** Se carga completa, sin paginación ni búsqueda.
- **Instalación.** El comportamiento "sin barra del navegador" depende del spec 011 (manifest y service worker); este spec prepara la interfaz para pantalla completa.
- **Letra más chica.** La fuente pixel es difícil de leer por debajo de ~9 px; los tamaños se bajan solo hasta ahí, y el texto de lectura se mantiene en la fuente del sistema.
- **Decisión tomada:** *Cuenta* es la tercera pestaña (con el cierre de sesión adentro); el ícono de salir sale de la barra superior.

## Resultado y notas de implementación
- **Medido en Chrome (emulación móvil, build de producción), sin zona segura:** la barra superior mide **48 px** y la inferior **56 px** en las 7 pantallas medidas (pasos 1, 2 y 3, biblioteca, detalle y cuenta; más "mezclando" y acceso) a **360x640, 390x844 y 360x560**; el área de contenido es siempre el resto (536, 740 y 456 px). **La página nunca hace scroll** (el documento mide igual que la ventana y no hay scroll horizontal); lo que sobra hace scroll solo dentro del contenido.
- **Zona segura simulada** (barra de estado de 44 px y barra de gestos de 34 px): barra superior 92 px (48 + 44), inferior 90 px (56 + 34) y contenido de 662 px en 390x844; nada queda tapado.
- **Paso 1 sin scroll con la barra inferior:** Rueda en 360x640, 390x844 y 360x560; Foto en 360x640 y 390x844 (a 360x560 la pestaña Foto tiene +35 px de scroll interno, como se permitió).
- **Comportamiento de app (probado con eventos táctiles y de mouse reales):** triple clic sobre el título no selecciona texto (`user-select: none`; los campos de texto sí son seleccionables); dos toques rápidos en una zona vacía dejan la escala de la página en 1; arrastrar hacia abajo desde el tope del contenido no mueve la página ni las barras; al hacer scroll del contenido las barras no se mueven. Con `prefers-reduced-motion` hay **0 elementos animados** en las pantallas medidas (3 a 8 sin la preferencia).
- **Escala compacta:** textos de 9–15 px (antes 10–18), bordes de 2 px (antes 3), sombras de 3 px (antes 4), espacios ×0.85, frascos y muestras ~15 % más chicos. Los botones se ven de **40 px** (34 px los chicos y 44 px los principales) y **responden al toque como 44 px**: medido con `elementFromPoint`, los botones normales y chicos llegan a 44 px (la excepción es un botón que queda pegado a la barra inferior, donde la barra tapa los píxeles de debajo). Las pestañas miden 53 px de alto.
- **Navegación:** rutas por hash (`#/`, `#/recetas`, `#/recetas/<id>`, `#/cuenta`); cambiar de pestaña conserva el color, las pinturas elegidas y el resultado (probado). Abrir `#/recetas/<id>` directo carga las recetas; un id inexistente muestra "No encontramos esta receta" con salida.
- **Reemplazos:** `WizardLayout` se eliminó y lo reemplaza `AppShell`; el ícono de cerrar sesión salió de la barra superior y está en la pestaña **Cuenta**.
- **Desvíos del plan:** (1) el cálculo de qué recetas se guardaron usa `recipeSignature` (objetivo + partes) guardado en `mixStore.savedRecipes`; (2) los toques de la foto ahora se miden con `performance.now()` (en vez de `event.timeStamp`) para que los tests de toques no dependan de la velocidad de la máquina; (3) el botón "Mezclar este color otra vez" puede partirse en dos líneas en pantallas angostas.
- **No se pudo comprobar aquí:** el teclado en un iPhone real, el comportamiento en un teléfono real con la app instalada, la fila real en Supabase y que otra cuenta no vea mis recetas (RLS).
