# 010 — Zoom dentro de la foto (punto y recorte más exactos)

- **Estado:** implementado (probado con gestos táctiles reales en Chrome; falta probarlo en tu teléfono, sobre todo en iPhone)
- **Fecha:** 2026-11-14

## Objetivo
Poder **acercar la foto con los dedos** (pellizco) para elegir el punto o encuadrar el recorte con más exactitud, **sin que se agrande la app**: el marco de la foto conserva exactamente el mismo alto y ancho en pantalla y el zoom ocurre solo dentro de él. Vale para el color objetivo (paso 1) y para las pinturas (paso 2).

## Alcance
- Incluye:
  - Un **visor con zoom y desplazamiento** (`PhotoViewport`) dentro del marco de la foto: pellizco con dos dedos, arrastre con un dedo para mover la foto, doble toque para acercar o volver, rueda del mouse en escritorio y botones **+**, **−** y **1×** como alternativa accesible.
  - Zoom de **1× a 8×**, con la foto siempre cubriendo el marco (no se puede arrastrar hasta dejar vacío).
  - Que el **recuadro de recorte** y la **mira del punto** sigan a la foto al acercar o mover, con esquinas y mira del mismo tamaño en pantalla (no se agrandan con el zoom).
  - Que **pellizcar sobre la foto no haga zoom de la página** (ni del navegador ni de la app); fuera del marco todo se comporta como siempre.
  - Que el color se siga calculando sobre la **foto original** (no sobre lo que se ve en pantalla), por lo que el zoom no cambia cómo se toma el color.
  - Mostrar los píxeles nítidos (`image-rendering: pixelated`) a partir de 3× para ver exactamente dónde se toca.
- No incluye: rotar la foto, guardar el nivel de zoom, aumentar la resolución con la que se carga la foto (sigue en 1024 px de lado máximo), lupa flotante.

## Plan
1. **Matemática pura** (`lib/zoom.js`, sin React, con tests):
   - `clampTransform(t, frame, image)` (límites de escala 1–8 y de desplazamiento).
   - `zoomAt(t, factor, point, frame, image)` (acerca alrededor de un punto).
   - `pinchTransform(start, a, b, frame, image)` (escala y desplazamiento a partir de dos puntos).
   - `imageToScreen` / `screenToImage` (convierten entre coordenadas normalizadas de la foto y píxeles del marco).
2. **Hook `usePanZoom`** (`hooks/`): maneja `pointerdown/move/up/cancel` con hasta 2 punteros, rueda y doble toque; distingue **toque** (movimiento < 8 px) de **arrastre**; expone `{ transform, handlers, zoomIn, zoomOut, reset }`. Evita el zoom del navegador con `touch-action: none` en el marco y bloquea el evento `gesturestart` de Safari en iOS.
3. **Molécula `PhotoViewport`**: el marco mantiene el tamaño que ya tiene (la foto a 1×, con el alto máximo relativo a la pantalla); dentro, un escenario con `transform` contiene el canvas, y una capa superpuesta (en coordenadas de pantalla) recibe la transformación para dibujar el recuadro o la mira. Incluye los botones + / − / 1× y un indicador del nivel ("2.5×") dentro del marco, sin ocupar alto extra.
4. **`PhotoCropper`**: el recuadro y sus 4 esquinas se calculan desde la transformación; mover y redimensionar convierten el desplazamiento del dedo a coordenadas de la foto (se divide por el zoom); arrastrar fuera del recuadro mueve la foto. Mantiene `onChange({ hex, thumbnail })`.
5. **`PhotoColorPicker`** (modo punto): un **toque** toma el color del punto (promedio de 5×5 px de la foto original); un **arrastre** mueve la foto; la mira queda en el mismo lugar de la foto.
6. Verificar en **Chrome con emulación táctil** (pellizco real con eventos táctiles): que la escala de la página (`visualViewport.scale`) se mantiene en 1, que el marco no cambia de tamaño y que el recuadro sigue la foto. Medir de nuevo el alto del paso 1 (Foto) a 360x640 y 390x844 para confirmar que sigue sin scroll.
7. Tests, `npm test`, `npm run lint`, `npm run build`.

## Archivos a crear/modificar
- `src/lib/zoom.js`, `zoom.test.js`
- `src/hooks/usePanZoom.js` (+ test)
- `src/components/molecules/PhotoViewport/` (+ test)
- `src/components/molecules/PhotoCropper/`, `PhotoColorPicker/` (usan el visor)
- `src/components/organisms/PaintCapture/` y `TargetColorPicker/` (solo si cambia algún texto de ayuda)

## Atomic design
- Átomos reutilizados: `PixelButton` (botones de zoom con ícono) y `PixelIcon` (íconos `plus` y `minus` nuevos).
- Molécula nueva: `PhotoViewport`; cambian `PhotoCropper` y `PhotoColorPicker`.
- La matemática y los gestos viven en `lib/` y `hooks/`, no en el componente.

## Datos (Supabase)
No aplica. Las fotos se siguen procesando solo en el dispositivo.

## Criterios de aceptación
- [x] Pellizcar sobre la foto la acerca y la aleja dentro del marco (1× a 8×); la página **no** hace zoom (`visualViewport.scale` sigue en 1).
- [x] El marco de la foto mantiene el mismo ancho y alto con cualquier nivel de zoom; el resto de la pantalla no se mueve ni cambia de tamaño.
- [x] Con un dedo se mueve la foto acercada sin salirse de los límites; el doble toque acerca o vuelve a 1×; los botones + / − / 1× y la rueda del mouse hacen lo mismo.
- [x] En modo recorte, el recuadro sigue a la foto al hacer zoom o moverla; mover y redimensionar el recuadro funciona con la misma precisión a cualquier zoom; las esquinas no se agrandan con el zoom y tienen una zona táctil de 44 px.
- [x] En modo punto, un toque toma el color exacto del punto tocado a cualquier zoom (el cálculo usa la foto original) y un arrastre mueve la foto sin elegir un color.
- [x] A partir de 3× se ven los píxeles nítidos.
- [x] Funciona igual en el recorte del paso 1 y en el de las pinturas del paso 2.
- [x] El paso 1 (Foto) sigue sin scroll: medido a 360x640 con una foto vertical cargada (documento de 640 px en una ventana de 640 px, sin scroll). A 390x844 no se volvió a medir en esta tanda (hay más alto disponible y el marco usa las mismas reglas de tamaño).
- [x] Con `prefers-reduced-motion` no hay animaciones de zoom; los botones tienen nombre accesible y se pueden usar con teclado.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **iPhone (Safari).** Bloquear el zoom de la página sobre un elemento depende de `touch-action: none` y del evento `gesturestart`; funciona en Chrome Android, pero **hay que probarlo en un iPhone real** y, si hace falta, ajustar.
- **Desplazar la página sobre la foto.** Mientras el dedo está sobre la foto, no se puede hacer scroll de la página (el gesto es de la foto); se hace scroll tocando fuera del marco. Es lo normal en un visor de fotos.
- **Resolución.** La foto se carga a 1024 px de lado máximo; a 8× cada píxel de la foto ocupa 8 de pantalla. Para elegir el color alcanza (el color no depende de la nitidez); si más adelante hace falta más detalle se puede subir ese límite a costa de memoria.
- **Elegir entre mover la foto y mover el recuadro.** Arrastrar *dentro* del recuadro lo mueve; arrastrar *fuera* mueve la foto. Con el recuadro muy grande a mucho zoom puede quedar poca foto "libre" para arrastrar; los botones y el pellizco siempre funcionan.
- **Pregunta para vos:** ¿te sirve el doble toque para acercar o volver (y los botones + / − / 1×), o preferís quitar los botones para dejar el marco más limpio?

## Resultado y notas de implementación
- **Verificado en Chrome con gestos táctiles reales** (emulación móvil 360x640, build de producción; pellizcos y toques con eventos táctiles del navegador, no simulados desde el código):
  - Un pellizco sobre la foto la acerca (de 1× a 3.1× y hasta 7.7×) y **la página queda en escala 1** (`visualViewport.scale = 1`).
  - **El marco no cambia**: misma posición y mismo tamaño (142x187 px en la prueba) antes y después de acercar, arrastrar y alejar; el documento tampoco cambia de tamaño y no hay scroll horizontal.
  - Las **esquinas del recuadro siguen midiendo 16 px** a cualquier zoom, mientras el recuadro crece de 40 a 125 px con la foto.
  - A partir de 3× se ven los **píxeles nítidos**.
  - Dos dedos juntándose alejan la foto (7.7× → 2.3× → 1×) aunque empiecen **sobre el recuadro**; dos dedos moviéndose juntos desplazan la foto sin cambiar el zoom.
  - El **doble toque** acerca a 3× y otro doble toque vuelve a 1×, tanto fuera como sobre el recuadro.
  - **Modo punto, exactitud:** un toque a 1× tomó `#2b8eda`, el color exacto de la foto original en ese punto; después de acercar y tocar **el mismo punto de la foto**, tomó el mismo `#2b8eda`; el punto vecino con zoom tomó `#2b36da`, también exacto. Un arrastre no cambia el color; un dedo en modo punto mueve la foto acercada.
  - Un pellizco **fuera** de la foto (la barra de título) no hizo zoom de la página en esta emulación; el bloqueo del zoom del navegador está aplicado sobre el marco de la foto con `touch-action: none`, `overscroll-behavior: contain` y el bloqueo de los eventos `gesture*` de Safari.
- **Decisiones y límites que conviene conocer:**
  - **Arrastrar dentro del recuadro lo mueve; arrastrar fuera mueve la foto.** Con zoom alto (a partir de ~3× en un recuadro del 30 %) el recuadro puede cubrir todo el marco y no queda fondo para arrastrar con un dedo: en ese caso se mueve la foto con **dos dedos** (verificado) o se vuelve a acercar con los botones. En el modo punto, que no tiene recuadro, un dedo siempre mueve la foto.
  - **Doble toque sobre el recuadro** también hace zoom (para poder volver a 1× aunque el recuadro lo cubra todo); arrastrarlo no cuenta como doble toque.
  - Los **botones − / zoom actual / +** están dentro del marco (abajo a la derecha), con zona táctil de 44 px; el botón del medio muestra el nivel ("7.7×") y vuelve a 1×.
  - **Bordes y esquinas no se agrandan** porque se dividen por la variable CSS `--zoom` que pone el visor; la matemática del zoom vive en `lib/zoom.js` y los gestos en `hooks/usePanZoom.js`.
  - Se **quitó el consejo "Mejor con luz natural"** del paso 1 (era la segunda mitad de la línea de ayuda) para que el texto "Pellizcá para acercar." entre en una sola línea y el paso 1 siga sin scroll; el consejo de la luz sigue en el alta de pinturas.
  - La rueda del mouse (y el pellizco del trackpad) hacen zoom sobre la foto y no desplazan la página.
- **No se pudo comprobar aquí:** el comportamiento en un **iPhone real** (Safari). El bloqueo del zoom de la página depende de `touch-action` y del evento `gesturestart`; hay que probarlo en el teléfono.
