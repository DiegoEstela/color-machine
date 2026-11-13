# 016 — Ajustar la mezcla: más luz, más intenso, y qué sumar

- **Estado:** implementado (medido en Chrome con emulación móvil y tests; falta probarlo en un teléfono real)
- **Fecha:** 2026-11-13

## Objetivo
En el paso 3, poder **retocar la receta a ojo** cuando la mezcla no "se siente" igual al color original: un botón **"Ajustar"** abre un panel donde con dos controles simples —**Luz** (más claro / más oscuro) e **Intensidad** (más intenso / más apagado)— la receta se recalcula en vivo, y la app **solo dice qué hay que sumar** (blanco, negro u otro color) cuando con tus pinturas no se llega. Sin números ni términos técnicos.

## Cómo lo resolvemos (decisión de diseño)
"Más luz / más intenso" se hace **moviendo hacia dónde apunta el cálculo, no inventando cantidades**:
- Cada toque en **Luz +** desplaza el color que busca el solver a un tono **un poco más claro** (en Lab, ΔL = +4 por paso); **Luz −**, más oscuro. **Intensidad +** lo hace **más saturado** (croma ×1,12 por paso, mismo tono); **−**, más apagado. Hasta 3 pasos para cada lado.
- El solver (`spectral.js`, el mismo de siempre) busca la receta de partes enteras que mejor llega a ese color **desplazado**, pero **el parecido que se muestra se sigue midiendo contra el color original** (el real). Así el usuario ve el costo: "más luz, pero ahora queda *Parecido* en lugar de *Muy parecido*".
- Alternativas que se descartaron: (B) dar sliders continuos que cambien proporciones libres (rompe la regla de partes enteras y obliga a calcular cantidades); (C) solo mostrar diferencias L/C/h (es técnico y no deja hacer nada). La opción elegida es la más simple para alguien no técnico: **dos botones con − y +, y un texto que lo explica**.
- **Qué sumar:** con el color desplazado como objetivo se reutilizan `advisor.diagnose` y `suggestAdditions`. Si la receta ajustada todavía queda corta, el panel dice, por ejemplo, *"Para que quede más claro te falta blanco"* con el botón **+ Blanco** (o negro, o "otro color" si es de tono) que ya existe y recalcula al instante.

## Alcance
- Incluye:
  - Botón **"Ajustar"** (ícono + texto, chico) en el paso 3 junto al título de la receta y al ⓘ. Sin resultado listo (mezclando / error), está deshabilitado.
  - **Panel inferior** (bottom sheet, mismo patrón que `InfoSheet`: toque afuera / Esc / Atrás / botón; foco atrapado; `role="dialog"`), con:
    1. **Comparación en vivo**: frasco "Tu color" y frasco "Tu mezcla" + palabra de parecido (reutiliza `ColorCompare` compact).
    2. **Luz**: botones **− Más oscuro / Más claro +** con indicador de pasos (por ejemplo `◂ ▪▪▫▪▪ ▸` con el centro marcado) como `radiogroup`/spinbutton accesible, flechas del teclado.
    3. **Intensidad**: **− Más apagado / Más intenso +**, igual.
    4. **Frase de estado** en voseo, calculada del color real vs la mezcla: "Tu mezcla es un poco más oscura que tu color", "Casi igual de intensa", etc.
    5. **Qué falta** (solo si corresponde): mensaje + botones **+ Blanco / + Negro / + otro color** (máx. 2, como hoy), "quedaría *Muy parecido*".
    6. **Restablecer** (vuelve a 0 / 0) y **Listo** (cierra; el ajuste queda aplicado).
  - Con ajuste activo, en la pantalla se ve un **chip** "Ajustada: +1 luz, −1 intensidad" con una ✕ para quitarlo. Si se cambia el color objetivo, las pinturas o la precisión, el ajuste **se conserva** (se aplica al nuevo cálculo) salvo al cambiar el **color objetivo**, que lo reinicia.
  - **Guardar receta** guarda la receta ajustada (nombre, partes y el color de la mezcla); el **objetivo guardado sigue siendo el original** y la receta guarda también el ajuste (ver Datos).
  - Los pasos son **±3** por eje; en 0 / 0 el comportamiento es idéntico al actual.
- No incluye: cantidades en ml/gramos, sliders continuos, ajustar tono (rojo → naranja), IA, cambiar el consejero del paso 2, ajustes por pintura individual.

## Plan
1. **`features/color-mixer/tweak.js` (puro, con tests):**
   - `shiftTarget(hex, { light, vivid })` → hex desplazado (Lab: `L ± 4·light`, croma `× 1.12^vivid`, tono fijo, recortado al gamut sRGB con `culori`).
   - `TWEAK_LIMIT = 3`, `clampTweak`, `isNeutral`.
   - `describeGap(target, mix)` → `{ light: 'darker'|'lighter'|'same', vivid: 'duller'|'more'|'same' , sentences: [...] }` con umbrales (|ΔL| > 3, |ΔC| > 6) y frases en voseo.
2. **`solver.solve`:** parámetro opcional `aim` (default `target`): ordena y elige `recommended`/`best` por distancia a `aim`, pero cada receta devuelve `deltaE`/`quality` **contra `target`**. Sin `aim`, resultados idénticos a hoy (tests existentes intactos). Pasa por `solverClient` y el worker.
3. **`advisor`:** `diagnose` y `suggestAdditions` aceptan el color desplazado como objetivo (sin cambios de firma: se les pasa `shiftTarget(...)`).
4. **`mixStore`:** `tweak: { light: 0, vivid: 0 }`, `setTweak`, `resetTweak`; entra en `resultKey`; se reinicia con `setTarget` distinto, `remix` y `reset`. `calculate` pasa `aim`.
5. **UI:**
   - Molécula **`TweakControl`** (un eje: nombre, − / + de 44 px, indicador de 7 pasos, etiquetas de los extremos).
   - Organismo **`TweakSheet`** (usa el patrón de `InfoSheet`; se extrae un componente base `Sheet` si hace falta no duplicar el guard de historial).
   - `MixResult`: botón "Ajustar", chip del ajuste activo, y la receta mostrada sale del cálculo con `aim`.
6. **Tests:** `tweak.js` (desplazamientos, límites, gamut, frases), `solve` con `aim`, `mixStore`, `TweakControl`, `TweakSheet`, `MixResult` (abre el panel, pasos recalculan, chip, restablecer).
7. **Verificación en Chrome móvil** (harness temporal): 360×640, 390×844, 360×560 — el panel entra sin scroll o con scroll cómodo; zonas táctiles ≥ 44 px; capturas del panel; medir que el paso 3 (spec 015) no cambia con ajuste 0/0.
8. Actualizar `CLAUDE.md` (reglas del dominio y estructura).

## Archivos a crear/modificar
- `src/features/color-mixer/tweak.js` (+ test) — desplazar el objetivo y describir la diferencia.
- `src/features/color-mixer/solver.js` (+ test), `solver.worker.js`, `solverClient.js` — parámetro `aim`.
- `src/features/color-mixer/advisor.js` — solo si hace falta un helper; idealmente sin cambios.
- `src/features/color-mixer/mixStore.js` (+ test) — `tweak` y `resultKey`.
- `src/features/recipes/*` y `src/features/storage/recipesRepo.js` — guardar el ajuste dentro del jsonb `mix` o en un campo nuevo (ver Datos).
- `src/components/molecules/TweakControl/` y `src/components/organisms/TweakSheet/` (nuevos), `MixResult.*` — UI.
- `src/components/atoms/PixelIcon/icons.js` — ícono `tune` (si hace falta).
- `src/styles/tokens.css` — tokens que falten.
- `CLAUDE.md`, este spec.

## Atomic design
- Átomos: `PixelButton`, `PixelIconButton`, `PixelText`, `PixelJar`, `PixelIcon` (ícono `tune` nuevo, opcional).
- Moléculas: **`TweakControl`** (nueva), `ColorCompare` (reutilizada), `InfoSheet` (patrón).
- Organismos: **`TweakSheet`** (nuevo), `MixResult` (modificado).
- La lógica vive en `features/color-mixer/tweak.js`, sin React.

## Datos (Supabase)
- **Sin migración obligatoria:** la receta guardada ya contiene `target_hex`, `result_hex` y `mix` (copia de partes). Se guarda la receta **ajustada** tal cual (partes y `result_hex`), así que se abre igual que cualquier otra. "Mezclar este color otra vez" vuelve a empezar desde el color original (`target_hex`) **sin ajuste**.
- (Opcional, solo si querés recordar el ajuste: agregar `tweak jsonb` en `recipes` con `supabase/migrations/0002_recipe_tweak.sql`, que pegarías en el SQL Editor.) Propuesta: **no** hacerlo ahora.

## Criterios de aceptación
- [x] Con ajuste 0 / 0 el paso 3 funciona igual que antes: la clave de resultado es la de siempre, `solve` sin `aim` devuelve lo mismo (test) y los 560 tests previos siguen en verde.
- [x] "Ajustar" abre el panel; Luz y Intensidad recalculan apuntando a un color más claro/oscuro o más/menos intenso (`shiftTarget`, probado en `tweak.test.js` y `solve` con `aim`); el parecido (`deltaE`) se mide contra el color **original**.
- [x] El panel muestra la comparación en vivo, la frase de estado y, si falta, "Te falta blanco/negro/…" con botones **+ Color** (medido en Chrome: "+ Blanco, quedaría casi idéntico"). Mientras recalcula, el panel sigue abierto con "Calculando..." y los controles esperan.
- [x] Máximo ±3 pasos; **Restablecer** y la ✕ del chip "Ajustada: +2 luz, +2 intensidad" vuelven a 0 / 0.
- [x] El ajuste se reinicia al cambiar el color objetivo, con "Mezclar otra vez" y al cerrar sesión (`reset`), y se conserva al cambiar precisión o pinturas (tests de `mixStore`).
- [x] Guardar receta guarda la receta mostrada (ajustada); el objetivo guardado es el original (no se cambió `buildRecipePayload`).
- [x] Accesible: `role="dialog"`, foco atrapado/devuelto, Esc y Atrás cierran (patrón `InfoSheet`), cada eje es un `slider` con flechas/Inicio/Fin y botones con nombre; voseo. Contraste: mismos tokens de siempre.
- [x] Medido en Chrome (360×640, 360×560, 390×844): todos los botones del panel reciben el toque en su centro; la página sin scroll. A 360×640 y 390×844 el panel entra sin scroll; a 360×560 tiene ~33 px de scroll interno del panel (aceptable). Barras 48/56 sin cambios.
- [x] `prefers-reduced-motion`: el panel usa la animación global de `InfoSheet` (ya respeta la regla global).
- [x] Tests nuevos (`tweak`, `solve` con `aim`, `mixStore`, `TweakControl`, `TweakSheet`, `MixResult`); `npm test` (579), `npm run lint` y `npm run build` pasan.
- [ ] Pendiente de probar en teléfono real: que los pasos de luz/intensidad "se sientan" proporcionados con tus témperas (se calibran en `tweak.js`: `LIGHT_STEP`, `VIVID_STEP`).

## Notas de la implementación
- Con la fila del título de receta, a 360 px el texto "¿Qué receta querés ver?" pasa a **2 líneas** para dejar lugar al botón Ajustar (+ ⓘ); a 390 px sigue en una.
- Si las pinturas no tienen cómo aclarar (sin blanco), los pasos de Luz casi no cambian la mezcla: por eso el panel dice qué sumar. Con un tono lejano también aparece "Falta una pintura de un tono parecido al tuyo".
- `solve` agrega `aimDeltaE` solo cuando se usa `aim`; `rankOf` (exportada) decide el orden.
- Los sugerencias de "+ Color" se calculan contra el color ajustado (`aim`), por eso "quedaría…" mide el parecido con lo que se busca en ese momento.
- Ícono `tune` nuevo en `PixelIcon`.

## Riesgos y preguntas abiertas
- **Los pasos pueden no cambiar nada** si con tus pinturas no hay una receta más clara (p. ej. sin blanco): por eso el panel lo dice ("no se puede con estas pinturas, sumá blanco") en lugar de dejar los botones mudos.
- **Costo de cálculo:** cada paso corre el solver otra vez (Worker); con precisión "Preciso" y 4 pinturas puede tardar un instante, igual que hoy al cambiar la precisión. Se deshabilitan los botones mientras mezcla.
- El mapeo "paso → ΔL / croma" es una decisión de diseño que hay que calibrar con uso real (tamaños fáciles de cambiar).
- Depende de cambios de `MixResult` del **spec 015 (implementado, todavía sin subir)**: conviene subir 015 primero (o juntos). El **spec 014** (onboarding) debería mencionar esta función cuando se implemente.
- **Preguntas:**
  1. ¿Te cierra la idea (dos controles, **Luz** e **Intensidad**, con pasos − / + y el parecido siempre contra el color original)?
  2. ¿Los textos: "Más claro / Más oscuro" y "Más intenso / Más apagado" te sirven, o preferís "Más luz / Menos luz"?
  3. ¿El ajuste solo se guarda como receta resultante (recomendado) o querés que la receta recuerde el ajuste (agrega una columna y migración)?
  4. ¿Subimos primero el spec 015 y después hacemos este, o los subimos juntos?
