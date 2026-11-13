# 012 — Paso 3 compacto: una sola pantalla y sumar el color sugerido

- **Estado:** aprobado (con las opciones propuestas)
- **Fecha:** 2026-11-14

## Objetivo
Que el paso 3 **entre en una sola pantalla de celular sin scroll** y quede más limpio, y que el consejo de "sumale otro color" se pueda aplicar **con un toque, sin salir del paso 3**.

## Qué se mantiene
- El grupo **Simple / Normal / Preciso** queda como está (una fila, con su subtítulo y la frase que explica la opción elegida).
- La idea de que la app te diga qué color sumar (se conserva y se mejora: ahora se puede sumar al instante).

## Alcance
- Incluye:
  - **Grupo de receta en una sola fila con solo dos opciones: "Recomendada" y "Más exacta"** (se quita "Otras" de la pantalla). Se mantiene su título.
  - **Se quitan** la frase explicativa debajo de ese grupo ("La que más se acerca…") y el aviso "Es la misma que la recomendada".
  - **Después de los dos frascos grandes (Tu color / Tu mezcla) solo aparecen los frasquitos de la receta**, con su nombre y sus partes. Salen de la pantalla: el "Total: N partes en total", la nota de "1 parte" y el texto de "Es una aproximación".
  - **Botón ⓘ** junto al título de la receta que abre una hoja informativa (*bottom sheet*) con esa información ("1 parte = la medida que quieras…", "Es una aproximación: probá con una cantidad chica…" y la nota sobre pinturas estándar). La hoja se cierra con un toque afuera, con el botón o con Atrás.
  - **Parecido** en una sola línea corta bajo los frascos (medidor chico + palabra: "Casi idéntico", "Parecido"…), sin ΔE.
  - **Sumar el color sugerido al instante:** si la receta no alcanza, un aviso compacto dice qué falta ("Tu color es más claro") y muestra botones **+ Blanco**, **+ Negro**, etc. Tocar uno **lo agrega a esta mezcla y recalcula en el momento**, sin volver al paso 2. El color agregado usa un tono estándar de caja de témperas, aparece en la lista con la etiqueta "estándar" y se puede **quitar** con una ✕ o **reemplazar por tu pintura real** ("Usar la mía", que abre el alta de pintura con el nombre cargado, como hoy).
  - **Altura estable:** la zona del resultado mantiene el mismo alto mientras calcula (animación) y cuando muestra la receta; no hay saltos al cambiar entre "Recomendada" y "Más exacta" ni al cambiar la precisión.
- No incluye: guardar la receta (spec 009), cambiar el cálculo ni el consejero de pinturas del paso 2, editar el color estándar de una pintura sumada, más de 6 pinturas por mezcla.

## Plan
1. **Medir el "antes"** en Chrome con emulación móvil (360x640, 390x844) y registrar el alto del contenido del paso 3.
2. **`OptionGroup`:** soportar `columns` ya existente (2 columnas), sin descripción (`description` opcional ya lo permite) para el grupo de receta; quitar `others` del estado (`recipeKey` pasa a `recommended` | `best`).
3. **`MixResult`:** reordenar: precisión → receta → frascos grandes + parecido en una línea → frasquitos → aviso compacto con botones **+ Color** (si corresponde). Quitar los textos señalados. Reservar un alto mínimo para la zona del resultado (misma altura en "mezclando" y en "listo").
4. **Hoja informativa** (`InfoSheet`, molécula): panel inferior con fondo atenuado, cierre por toque afuera / botón / Atrás / tecla Esc, foco atrapado y `role="dialog"`. Con `prefers-reduced-motion` aparece sin animación.
5. **Sumar colores al instante** (`mixStore`): lista `extraPaints` (pinturas estándar agregadas a esta mezcla, solo en memoria) con `addExtra(role)`, `removeExtra(id)`; `calculate` recibe las pinturas elegidas **más** las agregadas; el resultado se invalida por la clave existente. Se limpian al cambiar el color objetivo y al cerrar sesión. Máximo 6 pinturas en total entre elegidas y agregadas; si se llega, los botones **+** se deshabilitan con una explicación.
6. **Pinturas estándar:** reutilizar `BASE_PAINTS` (rojo, amarillo, azul, blanco y negro) con un campo `standard: true` para etiquetarlas en la lista.
7. **Aviso compacto:** en `MixResult`, una franja de una o dos líneas con el diagnóstico (ya existe `diagnose`) y los botones de las sugerencias (`suggestions`), de uno a dos botones. Si ya se sumó el color sugerido y aun así no alcanza, no se vuelve a ofrecer el mismo.
8. **Verificar en Chrome** (360x640 y 390x844): el paso 3 con una receta de 2 y 3 pinturas entra sin scroll de página; con 4 pinturas sumadas solo la lista de frasquitos hace scroll interno; capturas del "antes y después".
9. Tests, `npm test`, `npm run lint`, `npm run build`.

## Archivos a crear/modificar
- `src/components/organisms/MixResult/` (reordenado, textos, sumar colores, ⓘ) y sus tests
- `src/components/molecules/InfoSheet/` (nuevo) y test
- `src/components/molecules/ColorCompare/` (parecido en una línea), `RecipeRow/` (etiqueta "estándar" y ✕)
- `src/components/atoms/PixelIcon/icons.js` (ícono `x` si falta)
- `src/features/color-mixer/mixStore.js` y test (`extraPaints`, sin `others`)
- `src/features/color-mixer/referencePaints.js` (`standard: true`)
- `src/pages/Create/Create.jsx` (pasa las pinturas agregadas al paso 3 y gestiona "Usar la mía")

## Atomic design
- Átomos reutilizados: `PixelButton`, `PixelText`, `PixelPanel`, `PixelJar`, `PixelMeter`, `PixelIcon`.
- Molécula nueva: `InfoSheet`. Modificadas: `ColorCompare`, `RecipeRow`, `OptionGroup` (uso).
- Organismo modificado: `MixResult`. El cálculo y el consejero (`solver`, `advisor`) no cambian.

## Datos (Supabase)
No aplica en este spec. Al guardar una receta (spec 009), el `mix` incluirá también las pinturas estándar agregadas, con su nombre, color y partes.

## Criterios de aceptación
- [ ] El grupo de receta tiene exactamente dos opciones ("Recomendada" y "Más exacta") en una sola fila y no existe la opción "Otras".
- [ ] No aparecen: la frase bajo el grupo de receta, "Es la misma que la recomendada", "Total: N partes en total", la nota visible de "1 parte" ni el texto visible de "Es una aproximación".
- [ ] Debajo de los dos frascos grandes solo se ven el parecido en una línea y los frasquitos de la receta (nombre y partes).
- [ ] El botón ⓘ abre una hoja con la nota de "1 parte", la aproximación y la nota de pinturas estándar; se cierra con toque afuera, botón, Esc y Atrás, y tiene `role="dialog"`.
- [ ] Si la receta no alcanza, aparece un aviso corto con botones **+ Color**; al tocar uno se suma a la mezcla, el resultado se recalcula al instante sin salir del paso 3 y la pintura aparece con la etiqueta "estándar".
- [ ] Una pintura sumada se puede quitar (✕) y reemplazar por la propia ("Usar la mía" abre el alta con el nombre cargado).
- [ ] Con 6 pinturas entre elegidas y sumadas, los botones **+** quedan deshabilitados con una explicación; cambiar el color objetivo descarta las pinturas sumadas.
- [ ] La zona del resultado no cambia de alto entre "mezclando" y "listo", ni al cambiar entre las dos recetas o la precisión (medido en Chrome).
- [ ] El paso 3 entra sin scroll de página en 360x640 y 390x844 con recetas de 2 a 3 pinturas; con más pinturas solo la lista de frasquitos hace scroll interno.
- [ ] Sin scroll horizontal a 360 px; objetivos táctiles >= 44 px; sin animaciones con `prefers-reduced-motion`; contraste AA.
- [ ] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Dependencia del spec 009.** El alto disponible depende de la barra superior y de la barra de pestañas; este spec se implementa **después** del 009 para medir sobre la estructura final (si se implementa antes, se mide con la estructura actual y se vuelve a medir).
- **Color estándar vs. tu pintura real.** Un blanco "estándar" puede diferir del que tenés en el frasco; por eso se etiqueta "estándar", la nota ⓘ lo aclara y existe "Usar la mía".
- **Información escondida.** Mover la nota de "1 parte" y la aproximación a una hoja la hace menos visible; el ⓘ está siempre junto al título de la receta.
- **Quitar "Otras"** elimina la posibilidad de ver recetas alternativas; el solver las sigue calculando pero la pantalla no las muestra (se podrá reintroducir después si hace falta).
- **Subtítulos de las dos opciones de receta.** Se conservan los subtítulos dentro de los botones ("la más simple", "la que más se parece") porque sin ellos el botón vuelve a no explicarse. Si querés quitarlos también, ganás ~14 px de alto.
- **Preguntas para vos:**
  1. ¿Dejamos el **parecido** como una línea corta bajo los frascos (medidor chico + palabra), o lo quitás también?
  2. ¿Está bien que el color sumado use un **tono estándar** (por ejemplo un blanco puro) en lugar de pedirte la foto de tu pintura?
