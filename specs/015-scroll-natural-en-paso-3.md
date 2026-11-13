# 015 — Scroll natural: la lista de pinturas del paso 3 deja de quedar apretada

- **Estado:** implementado (con las opciones propuestas: paso 3 con scroll natural, degradé "hay más abajo" incluido)
- **Fecha:** 2026-11-13

## Objetivo
Que cuando hay que ver la lista de colores (el paso 3 y cualquier pantalla con listas) la app **se pueda desplazar con naturalidad por toda la pantalla**, sin zonas diminutas con scroll adentro. Hoy el paso 3 tiene una "zona del resultado" **fija de 208 px** y los frasquitos solo ven 3 filas en una lista con scroll propio (spec 012): con 4–6 pinturas o con el aviso de "sumá otro color" todo queda apretado y cuesta leer.

## Cómo está hoy (explorado)
- El contenido de cada pantalla (`AppShell` → `<main>`) **ya hace scroll** cuando no entra; la barra superior y la inferior quedan fijas. La página (`html/body`) no se mueve, y eso se mantiene.
- El problema es el **scroll anidado** del paso 3: `MixResult.module.css` fija `.zone { height: 208px }` y `.rows { overflow-y: auto }`; con el aviso a 360×640 ya hay ~30 px de scroll interno "aceptado" (CLAUDE.md).
- Otras listas (Mis pinturas, Recetas, paso 2) ya viven en el scroll de `<main>`: no tienen este problema.

## Alcance
- Incluye:
  - **Paso 3:** la zona del resultado pasa de **alto fijo a alto mínimo** (`min-height: 208px`). La lista de frasquitos **crece a su tamaño natural** (sin scroll propio) y el que se desplaza es el contenido de la pantalla. Con 1–3 pinturas se ve igual que hoy; con más, la pantalla continúa hacia abajo.
  - Mantener lo que evita saltos: mientras mezcla y al mostrar la receta la zona usa el **mismo alto mínimo**, y al cambiar entre Recomendada / Más exacta o de precisión solo cambia el alto si cambia la cantidad de pinturas.
  - **Al sumar un color con "+ Blanco / + Negro"** la pantalla se desplaza para que se vea la fila nueva (hoy lo hace dentro de la lista; pasa a `scrollIntoView({ block: 'nearest' })` en el contenido).
  - **Aire al final** de cada pantalla con scroll: el último elemento no queda pegado a la barra inferior ni tapado por el botón central Crear (padding inferior del contenido).
  - **Indicio de que hay más abajo:** un degradé suave en el borde inferior del contenido cuando todavía se puede bajar (se quita al llegar al final). Solo visual, `pointer-events: none`.
  - Revisar que ninguna otra pantalla tenga alturas fijas que fuercen scrolls internos (se mide: Crear 1–3, Recetas, Detalle de receta, Mis pinturas, Cuenta).
- No incluye: tocar el **paso 1** (sigue **sin scroll**, es una regla fija de la app), mover las barras superior/inferior, hacer scrollear la página entera (`html/body` siguen sin scroll ni rebote), cambiar el cálculo ni los textos.

## Plan
1. **Medir el "antes"** en Chrome móvil (360×640, 390×844, 360×560): paso 3 con 2, 3, 4 y 6 pinturas, con y sin aviso; registrar scroll interno de `.rows` y de `<main>`.
2. **`MixResult.module.css`:** `.zone { min-height: var(--zone-h) }` (en lugar de `height`), `.rows { overflow: visible; flex: none }`, sacar el padding derecho solo necesario por el scroll interno si ya no hace falta (la zona táctil de los botones se conserva).
3. **`MixResult.jsx`:** reemplazar `rowsRef.scrollTo` por `scrollIntoView` de la fila nueva; sin cambios de lógica.
4. **`AppShell.module.css`:** padding inferior del contenido (+`--space-4`) y degradé inferior opcional (`ScrollFade`, ver Atomic design) que usa un `IntersectionObserver` o el evento `scroll` para saber si hay más contenido.
5. **Revisar el paso 3 sin scroll cuando entra:** con 2–3 pinturas a 390×844 sigue entrando entero (sin barra ni degradé).
6. **Tests:** actualizar `MixResult.test.jsx` (la zona usa `min-height`, no hay lista con scroll interno, se llama a `scrollIntoView` al sumar un color); tests nuevos del `ScrollFade`/hook.
7. **Verificación en Chrome** con capturas antes/después y mostrar qué cambió. Actualizar `CLAUDE.md` (regla del paso 3: ya no es "208 px siempre").

## Archivos a crear/modificar
- `src/components/organisms/MixResult/MixResult.module.css` y `.jsx` (+ test) — altura mínima, lista natural, `scrollIntoView`.
- `src/components/templates/AppShell/AppShell.module.css` y `.jsx` — padding inferior y degradé de "hay más".
- `src/hooks/useCanScrollMore.js` (+ test) — dice si queda contenido por debajo (para el degradé).
- `CLAUDE.md` — actualizar la regla del paso 3 y el índice de specs.
- Sin cambios en `features/` ni en Supabase.

## Atomic design
- Sin átomos nuevos. Hook `useCanScrollMore` en `hooks/`; el degradé vive dentro de `AppShell` (plantilla).
- `MixResult` (organismo) sigue igual en estructura; cambia solo su CSS y una llamada de scroll.

## Datos (Supabase)
Ninguno.

## Criterios de aceptación
- [x] Paso 3 con 4 pinturas (el solver usa hasta 4 por receta): la lista se ve completa, **sin scroll propio** (`overflow: visible`, medido); las barras no se mueven. Con 6 pinturas elegidas la receta también usa hasta 4.
- [x] Con 1–3 pinturas el paso 3 se ve como antes: a 390×844 entra entero (sin scroll ni degradé); la zona sigue con alto mínimo de 208 px (no hay saltos entre "mezclando" y la receta).
- [x] Al sumar "+ Blanco/+ Negro" se llama a `scrollIntoView({ block: 'nearest' })` sobre la fila nueva (test). **No probado en Chrome real.**
- [x] Más aire al final del contenido (`--space-5`): el último elemento no queda tapado por Crear.
- [x] El degradé aparece solo si hay más abajo (medido: `opacity 1` con scroll pendiente a 360×560 y `0` cuando entra) y no intercepta toques (`pointer-events: none`).
- [x] Paso 1 (Rueda) sigue **sin scroll** en 360×640, 390×844 y 360×560, incluso con el padding inferior nuevo; la página (`html/body`) sin scroll. **No re-medido:** paso 1 modo Foto (el cambio es 10 px más de padding inferior; si ahí no entra, hay que ajustarlo).
- [x] Barras de 48 y 56 px sin cambios.
- [x] `scrollIntoView` usa el comportamiento por defecto (instantáneo): sin animación suave.
- [x] Tests actualizados/nuevos (`MixResult`, `useCanScrollMore`, `AppShell`); `npm test` (539), `npm run lint` y `npm run build` pasan.
- [ ] Pendiente de probar en teléfono real: sensación del scroll con el dedo, iPhone y barra de gestos.

## Medido (Chrome emulando móvil, paso 3)
| Pantalla | Scroll del contenido |
|---|---|
| 360×640, 3–4 pinturas sin aviso | 0 (entra entero) |
| 360×640, 2 pinturas con aviso | 40 px (con degradé) |
| 360×560 | 40–120 px (con degradé) |
| 390×844 | 0 |

## Riesgos y preguntas abiertas
- El paso 3 pierde la idea "todo en una pantalla sin scroll" **cuando hay más de 3 pinturas** (a propósito); con 2–3 sigue entrando. Se actualiza la regla en `CLAUDE.md`.
- Sin altura fija, la receta puede crecer al sumar pinturas: es el comportamiento buscado, pero los botones inferiores ("Guardar", "Volver") bajan; se prueba que se alcancen bien.
- **Preguntas:**
  1. ¿Es esto lo que querías (que el paso 3 haga scroll en vez de tener la lista chica con scroll interno)? ¿O había otra pantalla donde también te quedaba apretado?
  2. ¿Te sirve el degradé de "hay más abajo", o preferís sin él?
  3. Este spec es independiente del 014 (onboarding), que sigue esperando tu aprobación: ¿cuál hacemos primero?
