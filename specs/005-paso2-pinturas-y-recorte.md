# 005 — Paso 2: pinturas, etiquetas y recorte de fotos

- **Estado:** implementado (código); falta probar en un móvil real y contra Supabase
- **Fecha:** 2026-11-13

## Objetivo
1. **Recorte de fotos**: poder encuadrar con un rectángulo la zona exacta de la foto que interesa, tanto para el **color objetivo** (paso 1) como para cada **pintura** (paso 2). El color sale del interior del recorte, no de un solo punto, y se ve el resultado en vivo.
2. **Paso 2**: el usuario fotografía cada frasco o témpera, recorta la zona de pintura, le pone una etiqueta ("rojo") y la guarda en su cuenta. Elige con cuáles pinturas quiere trabajar y pasa al paso 3.

## Alcance
- Incluye:
  - Molécula `PhotoCropper`: foto con rectángulo movible y redimensionable (pointer events, funciona con el dedo), con color en vivo y miniatura del recorte.
  - Cálculo del color de un recorte con **promedio recortado** (descarta los píxeles más claros y más oscuros para resistir brillos y reflejos).
  - Paso 1: la pestaña Foto suma un selector **Punto / Recorte** (se conserva el toque de un punto del spec 004). La miniatura del recorte queda como referencia visual del color objetivo.
  - Paso 2: lista de "Mis pinturas" (desde Supabase), alta con foto o hex, edición de nombre y color, borrado, y selección de las que se usarán en esta mezcla.
  - Estado de pinturas (`paintsStore`) con carga, errores y selección.
  - El paso 2 deja de ser provisorio; el paso 3 pasa a ser la pantalla provisoria "Próximamente: cálculo".
- No incluye: cálculo de proporciones (spec del paso 3), guardar fotos en Supabase Storage, rotar la foto, zoom con pellizco, guardado de recetas.

## Plan
1. `lib/crop.js` (puro, sin React): rectángulo normalizado `{x, y, w, h}` en 0–1. Funciones `defaultRect`, `clampRect`, `moveRect`, `resizeRect(rect, handle, dx, dy)` con tamaño mínimo (5 % del lado) y límites de la imagen.
2. `lib/color.js`: agregar `averageRect(imageData, rect, { trim = 0.1 })`. Toma hasta ~10 000 píxeles (muestreo uniforme para recortes grandes), los ordena por luminancia, descarta `trim` en cada extremo y promedia el resto; ignora píxeles transparentes.
3. `hooks/useImageCanvas.js`: extrae la carga de la foto a canvas (hoy dentro de `PhotoColorPicker`) para que la usen `PhotoColorPicker` y `PhotoCropper`.
4. `PhotoCropper`: dibuja la foto en un canvas, superpone el rectángulo (HTML absoluto en porcentajes, borde pixel, zona exterior oscurecida) con un área central para mover y 4 esquinas de arrastre de **>= 44 px** de zona táctil. Cada cambio calcula `hex` con `averageRect` y genera una miniatura (canvas de 96 px, `toDataURL`). Emite `onChange({ hex, thumbnail })`.
5. Paso 1: `TargetColorPicker` añade el selector Punto / Recorte (dos `PixelButton` con `aria-pressed`). `mixStore` guarda `targetThumb` (en memoria) junto a `targetColor`; se muestra a la izquierda del swatch grande.
6. `features/paints/paintsStore.js` (Zustand): `paints`, `selectedIds`, `status`, `error`, `thumbs` (mapa id → miniatura de la sesión), `load()`, `add({ name, hex, thumb })`, `update(id, values)`, `remove(id)`, `toggleSelect(id)` (máximo 6 seleccionadas). Usa `paintsRepo` (spec 002).
7. Moléculas `PaintCard` (swatch o miniatura, nombre, hex, selección) y `PaintForm` (nombre + hex + botones). Organismos `PaintCapture` (foto → recorte → nombre → guardar) y `PaintList` (tarjetas con seleccionar / editar / borrar, estados de carga y vacío).
8. Organismo `PaintsStep` que une `PaintList` y `PaintCapture` (se alterna entre "lista" y "agregar"); "Siguiente" se habilita con **2 a 6** pinturas seleccionadas.
9. `Create`: paso 2 usa `PaintsStep`; paso 3 provisorio. `TOTAL_STEPS` sigue en 3.
10. Tests, `npm test`, `npm run lint`, `npm run build` y prueba en móvil.

## Archivos a crear/modificar
- `src/lib/crop.js`, `crop.test.js`
- `src/lib/color.js` (`averageRect`) y `color.test.js`
- `src/hooks/useImageCanvas.js` (+ test)
- `src/components/molecules/PhotoCropper/`, `PaintCard/`, `PaintForm/` y `molecules/index.js`
- `src/components/molecules/PhotoColorPicker/` (usa el hook)
- `src/components/organisms/PaintCapture/`, `PaintList/`, `PaintsStep/` y `organisms/index.js`
- `src/components/organisms/TargetColorPicker/` (selector Punto / Recorte y miniatura)
- `src/features/paints/paintsStore.js` (+ test), `src/features/color-mixer/mixStore.js` (`targetThumb`)
- `src/pages/Create/Create.jsx`

## Atomic design
- Átomos reutilizados: `PixelButton`, `PixelText`, `PixelPanel`, `PixelInput`, `ColorSwatch`, `PixelIcon`.
- Moléculas nuevas: `PhotoCropper`, `PaintCard`, `PaintForm`.
- Organismos nuevos: `PaintCapture`, `PaintList`, `PaintsStep`.
- Lógica de geometría y color en `lib/`, sin React. Estado de pinturas en `features/paints`.
- Si `PaintCard` necesita un check pixel, se evalúa un átomo `PixelCheck`; por defecto se usa `aria-pressed`.

## Datos (Supabase)
Sin cambios de esquema: se usa la tabla `paints` del spec 002 (`name`, `hex`) con sus políticas RLS, mediante `paintsRepo`. **Requiere que la migración `0001_init.sql` esté ejecutada y que haya sesión iniciada.**
- Las **fotos y miniaturas no se guardan**: solo nombre y color. Las miniaturas viven en memoria durante la sesión y se pierden al recargar (la tarjeta vuelve a mostrar el swatch).
- Validaciones del cliente iguales a las de la base: nombre de 1 a 40 caracteres, hex válido.

## Criterios de aceptación
- [ ] El rectángulo se puede mover y redimensionar con el dedo; no sale de la foto ni baja del tamaño mínimo.
- [x] El color y la miniatura se actualizan en vivo mientras se ajusta el recorte.
- [x] Un reflejo o brillo pequeño dentro del recorte no cambia el color de forma apreciable (promedio recortado, con test).
- [x] Paso 1: se puede elegir entre Punto y Recorte; la miniatura del recorte queda visible como referencia.
- [ ] Se puede agregar una pintura con foto + recorte + nombre, o solo con nombre + hex, y aparece en la lista y en Supabase.
- [ ] Se puede renombrar, cambiar el color y borrar una pintura; los errores de red se muestran en español.
- [x] Se pueden seleccionar entre 2 y 6 pinturas; con menos de 2 "Siguiente" está deshabilitado y no deja pasar de 6.
- [x] Volver del paso 2 al 1 y avanzar de nuevo conserva el color objetivo, la selección y la lista.
- [x] Nombre vacío o de más de 40 caracteres y hex inválido se rechazan con mensaje.
- [ ] Sin scroll horizontal a 360 px; objetivos táctiles >= 44 px; sin animaciones con `prefers-reduced-motion`.
- [ ] Ningún estilo fuera de los tokens (colores sí; las dimensiones propias de cada componente, como 140px o 96px, siguen escritas en su CSS); ninguna foto sale del dispositivo (cumplido).
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Arrastre táctil**: mover y redimensionar un rectángulo con el dedo es delicado; las esquinas tendrán zona táctil amplia y `touch-action: none`. Hay que probarlo en un móvil real.
- **Fidelidad del color**: la luz, el balance de blancos y el tipo de pintura (brillante o mate) alteran el color fotografiado. El promedio recortado ayuda con los brillos, pero no con una luz coloreada; siempre se puede corregir el hex.
- **Miniaturas efímeras**: si querés ver siempre la foto de cada pintura habría que guardarla en Supabase Storage (cambia privacidad, costo y el spec 002). Por ahora no.
- **Límite de 6 pinturas** por mezcla: mantiene el cálculo del paso 3 rápido y los resultados prácticos (partes enteras pequeñas). Se puede subir después.
- **Sin zoom ni rotación** en el recorte: la foto se reduce a 1024 px; en el móvil se puede acercar la cámara antes de sacarla.
- **Dependencia de la migración**: si no se ejecutó `0001_init.sql`, la lista mostrará un error de base de datos.
