# 004 — Paso 1: elegir el color objetivo

- **Estado:** implementado (código); falta probar en un móvil real: cámara, galería, orientación y 360 px
- **Fecha:** 2026-11-13

## Objetivo
Primer paso del asistente de creación: el usuario elige el color que quiere lograr de tres maneras: **(a)** rueda de color con control de claridad, **(b)** foto sacada con la cámara, **(c)** foto subida desde la galería (tocando un punto de la imagen). Termina con un color objetivo en hex, visible en un swatch grande, y un botón "Siguiente" hacia el paso 2.

## Alcance
- Incluye:
  - Utilidades de color puras y testeadas (`lib/color.js`): conversión hex/HSL, color de un punto de la rueda, promedio de una región de píxeles.
  - Carga de imagen a canvas con reducción de tamaño (`lib/image.js`).
  - Molécula `ColorWheel` estilo pixel art (matiz en ángulo, saturación en radio) más un control de claridad.
  - Molécula `PhotoPicker` (botones "Cámara" y "Galería") y molécula `PhotoColorPicker` (foto con mira; al tocar toma el color).
  - Organismo `TargetColorPicker` con pestañas Rueda / Foto, campo hex editable y vista previa.
  - Plantilla `WizardLayout` con indicador de paso (1 de 3) y página `Create`.
  - Store `useMixStore` (Zustand) con el paso actual y el color objetivo.
  - `App` pasa a mostrar `Create`; el catálogo queda accesible en `/?catalog=1`.
- No incluye: paso 2 (pinturas) más allá de una pantalla provisoria con el color elegido y "Volver", guardado en Supabase, animaciones de mezcla, vista de cámara en vivo con `getUserMedia`.

## Plan
1. `lib/color.js` con `culori`: `hexToHsl`, `hslToHex`, `isValidHex`/`normalizeHex`, `wheelPointToHsl(x, y, radius, lightness)` (devuelve `null` fuera del círculo), `averageRegion(imageData, x, y, radius)` → hex.
2. `lib/image.js`: `loadImageToCanvas(file, maxSize = 1024)` usando `createImageBitmap` (respeta la orientación EXIF), dibuja en un canvas escalado y libera la memoria; rechaza archivos que no sean imagen.
3. Store `features/color-mixer/mixStore.js`: `step`, `targetColor`, `setTarget`, `next`, `back`.
4. Molécula `ColorWheel`: dibuja una grilla de baja resolución (p. ej. 48x48 celdas) en un canvas escalado con `image-rendering: pixelated` para el look pixel art. Eventos de puntero (`pointerdown/move`) con `touch-action: none`. Marcador del color actual. Debajo, tres controles accesibles de teclado (matiz, saturación, claridad) como `<input type="range">` estilizados.
5. Moléculas `PhotoPicker` y `PhotoColorPicker`. Cámara: `<input type="file" accept="image/*" capture="environment">`; galería: mismo input sin `capture`. Al tocar la foto se toma el promedio de una región de 5x5 px (reduce el ruido) y se muestra una mira y una lupa/previsualización del color.
6. Organismo `TargetColorPicker` con las dos pestañas, el campo hex (`PixelInput`) y `ColorSwatch` grande. Botón "Siguiente" deshabilitado hasta que haya color.
7. Plantilla `WizardLayout` (cabecera con indicador de paso usando `PixelBar`) y página `Create` que lee `step` del store.
8. Actualizar `App.jsx` para montar `Create` y mantener el catálogo detrás de `?catalog=1`.
9. Tests, `npm test`, `npm run lint`, `npm run build`, y prueba manual en móvil (Vercel o red local).

## Archivos a crear/modificar
- `src/lib/color.js`, `src/lib/color.test.js`
- `src/lib/image.js`, `src/lib/image.test.js`
- `src/features/color-mixer/mixStore.js`, `mixStore.test.js`
- `src/components/molecules/ColorWheel/`, `PhotoPicker/`, `PhotoColorPicker/` (jsx + css module, test donde haya lógica) y `index.js`
- `src/components/organisms/TargetColorPicker/` y `index.js`
- `src/components/templates/WizardLayout/` y `index.js`
- `src/pages/Create/Create.jsx` y su CSS
- `src/App.jsx`

## Atomic design
- Átomos reutilizados: `PixelButton`, `PixelText`, `PixelPanel`, `PixelInput`, `ColorSwatch`, `PixelIcon`, `PixelBar`.
- Moléculas nuevas: `ColorWheel`, `PhotoPicker`, `PhotoColorPicker`.
- Organismo nuevo: `TargetColorPicker`. Plantilla nueva: `WizardLayout`. Página nueva: `Create`.
- Posible átomo nuevo `PixelSlider` (range con estilo pixel) si se usa en más de un lugar; si no, queda dentro de `ColorWheel`.
- La lógica de color vive en `lib/` y no importa React.

## Datos (Supabase)
No aplica. El color objetivo solo vive en el store hasta el hito de guardado (se guardará en `recipes.target_hex`). **Las fotos nunca se suben**: se procesan en el dispositivo y se descartan.

## Criterios de aceptación
- [x] Tocar o arrastrar sobre la rueda cambia el color y el hex mostrado; los controles de matiz, saturación y claridad dan el mismo resultado con teclado.
- [ ] En el móvil, "Cámara" abre la cámara y "Galería" abre la galería; la foto se muestra completa y con la orientación correcta.
- [x] Tocar un punto de la foto fija el color objetivo con el promedio de su entorno (5x5 px).
- [x] El campo hex acepta `#abc`, `#aabbcc` y `aabbcc`, rechaza valores inválidos con un mensaje y no rompe el estado.
- [x] "Siguiente" está deshabilitado sin color y lleva al paso 2 (provisorio); "Volver" conserva el color.
- [ ] Una foto de 12 MP no congela la interfaz (se reduce a 1024 px de lado máximo).
- [x] Archivos que no son imagen muestran un error claro.
- [ ] Sin scroll horizontal a 360 px; objetivos táctiles >= 44 px; sin animaciones con `prefers-reduced-motion`.
- [x] Ningún estilo fuera de los tokens; ninguna foto sale del dispositivo.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **`capture` en escritorio y algunos navegadores** se ignora y abre el selector de archivos; es el comportamiento esperado. Una cámara en vivo con `getUserMedia` (más control, más permisos) queda como mejora futura. ¿Te sirve el enfoque de "sacar foto con la app nativa de cámara"?
- **Fidelidad del color**: la luz, el balance de blancos y el filtro de la cámara alteran el color real. Se avisará con un texto breve ("mejor con luz natural y sin filtros") y siempre se puede ajustar el hex a mano.
- **Rueda tipo HSL**: la claridad es un control aparte (no un disco que lo incluya todo). Es la forma más clara de cubrir "todos los colores y claridades"; si preferís otro modelo (por ejemplo disco matiz/claridad con saturación fija), se cambia dentro de `ColorWheel`.
- **Rendimiento del canvas** en móviles viejos: se usa una grilla pequeña escalada para que el redibujado sea barato.
- **Catálogo**: deja de ser la pantalla principal; queda oculto tras `?catalog=1`. ¿Preferís eliminarlo o dejarlo así?
