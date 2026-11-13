# 017 — Editar una receta guardada y consejo completo de colores

- **Estado:** implementado (medido en Chrome con emulación móvil y tests; falta probarlo en un teléfono real y contra tu Supabase)
- **Fecha:** 2026-11-13

## Objetivo
Este spec tiene **dos partes**:
- **A. Editar una receta guardada.**
- **B. Que la app siempre diga qué colores faltan** (todos, no solo "falta un tono parecido").

### Parte A — editar
Poder **abrir una receta guardada y seguir retocándola** hasta que quede como querés: hacerla más clara o más oscura con un toque, **subir o bajar las partes** de cada pintura, **sumarle más de cualquier color** (de Mis pinturas o estándar: blanco, negro, rojo…) y ver en vivo si se acerca o se aleja del color que buscabas. Al final, **guardar los cambios o guardar una copia**.

Hoy el detalle de una receta solo deja **renombrar, borrar y "Mezclar este color otra vez"** (que arranca de cero). No se puede mejorar lo que ya guardaste.

### Parte B — consejo completo: "qué colores te faltan y cómo se hace"
**Problema (confirmado en el código):** `advisor.suggestAdditions` prueba sumar **de a una** pintura base que falta, y solo la ofrece si esa sola mejora ≥ 3 de ΔE (o sube de categoría). Cuando el color necesita **dos o tres colores que no tenés** a la vez (por ejemplo, un verde con solo rojo y negro: hace falta amarillo **y** azul), ninguna suma individual alcanza → la lista queda vacía y `diagnose` cae en *"Falta una pintura de un tono parecido al tuyo"*, que no dice cuál ni cómo.

**Qué se quiere:** cada vez que la mezcla no alcance (ΔE ≥ 5) la app dice **cuáles son todos los colores que hay que sumar** y **cómo queda la receta con ellos**, y los suma con un toque. Nunca más un aviso sin acción.

## Qué se encontró (explorado)
- `recipesRepo` (genérico `createRepo`) **ya tiene `update(id, patch)`** y `recipesStore.rename` lo usa solo para `name`. Las políticas RLS **`recipes_update_own`** ya permiten actualizar cualquier columna de las recetas propias (con `with check` por dueño). Los `check` de la tabla aceptan lo que necesitamos (`mix` 1–12 elementos, hex válidos).
- La receta guarda una **copia** de las pinturas (`mix: [{name, hex, parts}]`), el color buscado (`target_hex`) y el color de la mezcla (`result_hex`). Con eso alcanza para recalcular la mezcla en la pantalla con `mixHex` (spectral.js) **sin consultar Mis pinturas**.
- Conclusión: **no hace falta migración ni cambios de esquema.**

## Decisiones de diseño
- **Qué es el "color objetivo" al editar:** el **`target_hex` original** (el color que querías lograr). El parecido siempre se mide contra él. Se muestra **antes → ahora** ("Antes: Parecido · Ahora: Muy parecido ▲ mejoró") para que se vea si el cambio ayuda, y se puede **restablecer** a lo guardado.
- **"Más claro / Más oscuro":** son atajos que **suman 1 parte de Blanco / de Negro estándar** a la mezcla (si ya está, le suman una parte). Es lo que haría una persona con las pinturas en la mano y mantiene todo en partes enteras. La **intensidad** y los tonos se tocan sumando otro color (no se reutiliza el solver del spec 016: acá la receta la manejás vos, no la recalcula la app).
- **Sumar "cualquier color":** un selector con **Mis pinturas** (las de tu cuenta) y las **estándar** (Rojo, Amarillo, Azul, Blanco, Negro). Elegir una la agrega con 1 parte; si ya está en la receta, suma una parte.
- **Guardar:** dos botones.
  - **Guardar cambios** (sobrescribe esta receta) — recomendado como principal porque pediste "editar el color guardado".
  - **Guardar como copia** (crea una receta nueva con el nombre "<nombre> (editada)", editable) — para probar sin perder la original.
  Si hay cambios sin guardar y se sale (Atrás, otra pestaña), se pregunta "¿Descartar los cambios?".

## Alcance
- Incluye:
  - Botón **"Editar mezcla"** en el detalle de la receta → pantalla de edición en la ruta **`#/recetas/<id>/editar`** (el botón Atrás vuelve al detalle).
  - **Vista previa en vivo:** frascos "Tu color" (objetivo original) y "Tu mezcla" (la que estás armando) + parecido en palabras + línea **Antes → Ahora** (mejoró / igual / empeoró).
  - **Filas editables** por pintura: nombre, color, **− / +** partes (1 a 20), y ✕ para quitarla (queda al menos 1 pintura).
  - Atajos **Más claro (+ Blanco)** y **Más oscuro (+ Negro)**, y **"Sumar otro color"** (selector de pinturas).
  - **Deshacer** (último cambio) y **Restablecer** (vuelve a lo guardado).
  - **Guardar cambios** y **Guardar como copia**, con error y estado de carga; sin conexión muestra el mensaje habitual.
  - Límites: **hasta 6 pinturas distintas** y **hasta 20 partes por pintura**; los botones se deshabilitan con una explicación breve. Si una receta vieja ya tiene más de 6, se puede editar pero no sumar más.
  - Al guardar se actualizan `mix` y `result_hex`; **`target_hex` no cambia**. La lista de recetas se actualiza sin recargar.
  - **Parte B — consejo completo:**
    - Nueva función pura `advisor.planMissingPaints(target, selectedPaints)`: prueba combinaciones de **1, 2 y hasta 3** pinturas base que no tenés (Rojo, Amarillo, Azul, Blanco, Negro, según `matchPaints`) y devuelve **el conjunto más chico que lleva el parecido a ΔE < 5** o, si ninguno llega, **el que más se acerca**. Resultado: `{ roles: [...], recipe, deltaE, quality }` (la receta ya calculada con tus pinturas + esas).
    - **Mensaje siempre accionable**, en voseo: *"Para este color te faltan: Amarillo y Azul. Con eso queda Muy parecido: 2 Amarillo · 1 Azul · 1 Rojo."* Se reemplaza el texto vago de `need_hue` ("Falta una pintura de un tono parecido") por este plan.
    - Botones: **+ Agregar todos** (suma todos los colores del plan como pinturas estándar y recalcula) y los **+ Color** individuales de siempre. Respeta el máximo de 6 pinturas (si no entran todos, lo explica y ofrece los que entran).
    - Dónde se ve: **paso 3** (aviso amarillo de siempre), **panel "Ajustar"** del spec 016 (reemplaza "Te falta…" por el plan completo) y **el editor de recetas** (en "Sumar otro color" aparece arriba "Te conviene sumar: …" para acercarte al color buscado).
    - Si con **cualquier** combinación de la caja base no se llega, dice cuánto se puede lograr ("lo más cerca que se llega es *Parecido*") en lugar de quedarse mudo.
- No incluye: recalcular con el solver ni "sugerir" proporciones en el editor, ajuste de Luz/Intensidad por pasos del spec 016, historial de versiones, editar el color buscado, cantidades en ml/gramos, editar desde el paso 3 (solo desde Recetas).

## Plan
1. **Lógica pura, con tests** (`features/recipes/editor.js`):
   - `createDraft(mix)` copia la receta a un borrador `[{name, hex, parts}]`.
   - `bumpParts(draft, index, delta)` (1..20), `removePaint(draft, index)` (mín. 1), `addPaint(draft, paint, parts = 1)` (suma si ya existe por hex+nombre; máx. 6), `lighten(draft)` / `darken(draft)` (suman Blanco / Negro estándar de `referencePaints`).
   - `draftResult(draft)` → hex con `mixHex`; `compareToSaved({ target, savedResult, draftResult })` → `{ before, after, trend: 'better'|'same'|'worse' }` con ΔE 2000 (tolerancia 0,3 para "igual").
   - `isDirty(saved, draft)` y `buildEditPayload(draft, resultHex)` → `{ mix, result_hex }` validado (reusa las reglas de `validation.js`).
   - Historial para Deshacer: pila de borradores (máx. 30).
2. **Parte B — `advisor.planMissingPaints` (puro, con tests):** candidatos = bases que `matchPaints` marca como `missing`; combinaciones de tamaño 1 → 2 → 3 (máx. 25 con 5 bases); para cada una `solve` con `maxParts` de la precisión elegida (tope 8 para el consejo) y `maxPaints` 4; se elige la de menor tamaño con ΔE < 5 y, si no hay, la de menor ΔE (desempata menos pinturas). Corre en el **Worker** (`solverClient` + `solver.worker.js`, nuevo `kind: 'plan'`) y se guarda en `mixStore.result.plan` junto a `suggestions` (que se conserva por compatibilidad). `diagnose` sigue dando el motivo (claridad / intensidad / tono) y el plan da el remedio. `describePlan(plan)` arma la frase.
3. **Store:** `recipesStore.updateMix(id, { mix, result_hex })` (usa `recipesRepo.update`, actualiza la lista, devuelve `{ data }` o `{ error }`). "Guardar como copia" usa `add` con un payload nuevo.
4. **Ruta:** `parseRoute` suma `{ name: 'recipe-edit', id }` y `ROUTES.recipeEdit(id)`; `tabFor` → Recetas. Aviso de cambios sin guardar con el patrón de historial de `InfoSheet`/`historyGuard`.
5. **UI:**
   - Molécula **`PartsStepper`** (− n +; 44 px de toque, `role="group"`, nombre accesible con la pintura).
   - Molécula **`EditableRecipeRow`** (o `RecipeRow` con modo edición: reutiliza el frasquito y la barra de proporción).
   - Molécula **`PaintPicker`** (lista de Mis pinturas + estándar, dentro de un bottom sheet con el patrón `InfoSheet`).
   - Organismo **`RecipeEditor`** (preview + filas + atajos + deshacer/restablecer + guardar).
   - Página **`RecipeEdit`** (`AppShell` con ← "Volver a la receta").
6. **Paso 3, panel Ajustar y editor:** mostrar el plan (`PlanAdvice`, molécula nueva: frase + botón "+ Agregar todos" + botones individuales) en `MixResult`, `TweakSheet` y `RecipeEditor`.
7. **Detalle de receta:** botón **"Editar mezcla"**; "Mezclar este color otra vez" queda igual.
8. **Verificación en Chrome móvil** (harness temporal, luego borrar): 360×640, 390×844, 360×560; scroll cómodo (la pantalla usa el scroll del contenido, spec 015), zonas táctiles, capturas del editor y del selector; probar que guardar actualiza la lista.
9. Actualizar `CLAUDE.md` (rutas, estructura, índice de specs).

## Archivos a crear/modificar
- `src/features/color-mixer/advisor.js` (+ test), `solver.worker.js`, `solverClient.js` (+ test), `mixStore.js` (+ test) — `planMissingPaints`, `describePlan`, plan en el resultado.
- `src/components/molecules/PlanAdvice/` (nuevo), `MixResult.*`, `TweakSheet.*` — mostrar el plan completo.
- `src/features/recipes/editor.js` (+ test) — lógica del borrador, atajos, comparación y payload.
- `src/features/recipes/recipesStore.js` (+ test) — `updateMix`.
- `src/features/navigation/useRoute.js` (+ test) — ruta `recipe-edit`.
- `src/components/molecules/{PartsStepper,EditableRecipeRow,PaintPicker}/` (nuevos) y `index.js`.
- `src/components/organisms/RecipeEditor/` (nuevo), `RecipeDetail.jsx` (botón "Editar mezcla"), `index.js`.
- `src/pages/RecipeEdit/` (nuevo) y `src/App.jsx`.
- `src/styles/tokens.css` — solo si hacen falta tokens.
- `CLAUDE.md`, este spec.

## Atomic design
- Átomos: reutiliza `PixelButton`, `PixelIconButton`, `PixelText`, `PixelJar`, `PixelPanel`, `PixelBar`.
- Moléculas: **`PartsStepper`**, **`EditableRecipeRow`**, **`PaintPicker`**, **`PlanAdvice`** (nuevas); `ColorCompare`, `InfoSheet` (reutilizadas).
- Organismos: **`RecipeEditor`** (nuevo), `RecipeDetail` (modificado). Página: `RecipeEdit`.
- La lógica vive en `features/recipes/editor.js`, sin React.

## Datos (Supabase)
- **Sin migración.** Se hace `update recipes set mix = …, result_hex = … where id = …`, que las políticas `recipes_update_own` ya permiten solo al dueño. "Guardar como copia" es un `insert` como al guardar desde el paso 3. Los `check` existentes (hex válido, `mix` de 1 a 12 elementos, nombre 1–60) siguen valiendo: el editor limita a 6 pinturas.
- La copia de pinturas dentro de `mix` no cambia de formato (`[{name, hex, parts}]`), así que las recetas viejas se abren igual.

## Criterios de aceptación
- [x] El detalle tiene "Editar mezcla" y abre `#/recetas/<id>/editar`; funciona abierto directo (App test) y la flecha ← vuelve al detalle.
- [x] Al abrir, el borrador es idéntico a lo guardado: "Antes" y "Ahora" coinciden (el "antes" se recalcula con la mezcla guardada) y no hay botón de guardar ni de restablecer activo.
- [x] − / + cambian las partes (1 a 20) y la vista previa se actualiza al instante; ✕ quita una pintura pero siempre queda al menos una.
- [x] "Más claro" suma 1 parte de Blanco y "Más oscuro" 1 de Negro (si ya están, suman una parte); el frasco se aclara / oscurece (tests de `editor.js` y del editor).
- [x] "Sumar otro color" abre el selector con Mis pinturas y las estándar; elegir una la agrega con 1 parte (o suma si ya está); al llegar a 6 pinturas distintas se deshabilita con un mensaje.
- [x] La línea "Antes → Ahora" y el panel de color dicen mejoró / igual / empeoró según ΔE contra el color buscado original.
- [x] Deshacer revierte el último cambio (hasta 30) y Restablecer vuelve a lo guardado de una vez.
- [x] **Guardar cambios** manda solo `mix` y `result_hex` (el objetivo no cambia) y navega al detalle; **Guardar como copia** pide el nombre ("… (editada)") y crea otra receta sin tocar la original (tests con el store; **no probado contra Supabase real**).
- [x] Con cambios sin guardar, tocar un enlace o el botón Atrás pregunta "¿Descartar los cambios?" (Seguir editando / Descartar); medido en Chrome tocando la pestaña Cuenta.
- [x] Si guardar falla, muestra el error y conserva el borrador (test).
- [x] Zonas táctiles: todos los botones del editor reciben el toque en su centro (`elementFromPoint`); página sin scroll y barras 48/56 en 360×640, 360×560 y 390×844 (el contenido hace scroll: ~20 px a 360×640, ~100 px a 360×560, 0 a 390×844). El selector, a 360×640, mide 544 px con ~11–38 px de scroll interno.
- [x] **Parte B:** con un color que necesita 2 o 3 colores que no tenés (verde con solo rojo y negro), la app dice "Para este color te faltan: Amarillo y Azul. Con eso queda muy parecido: 3 Amarillo · 4 Azul." con "Agregar todos" y los botones individuales; "Agregar todos" suma y recalcula (test de `MixResult`).
- [x] **Parte B:** elige el conjunto más chico que alcanza (naranja con azul y negro → Rojo y Amarillo, no tres) o, si ninguno llega, el que más se acerca con su calidad ("Sumando X te acercás todo lo que se puede…"); no ofrece pinturas que ya tenés; si no hay nada que sumar dice lo más cerca que se llega.
- [x] **Parte B:** el plan aparece en el paso 3, en el panel Ajustar y en el selector del editor ("Te conviene sumar"); corre en el Worker. Medido en node: 40–90 ms con 10 partes y 2–6 pinturas, hasta ~210 ms en el peor caso probado (6 pinturas, 3 colores por sumar); con 16 partes llegaba a ~1,5 s, por eso el consejo se limita a 10 partes.
- [x] Accesible: nombres en cada control ("Sumar una parte de Rojo", "Quitar Azul"), foco atrapado en los paneles, contraste con los tokens de siempre, voseo.
- [x] Tests nuevos (`editor`, `planMissingPaints`/`describePlan`, `recipesStore.updateMix`, ruta, `useLeaveGuard`, `PartsStepper`, `EditableRecipeRow`, `PaintPicker`, `PlanAdvice`, `RecipeEditor`, `RecipeDetail`, `MixResult`, `App`); `npm test` (661), `npm run lint` y `npm run build` pasan.
- [ ] Pendiente de probar en teléfono real: guardar/actualizar contra tu Supabase y que otra cuenta no pueda editar tus recetas (RLS); cómo se siente el Atrás con cambios sin guardar en iPhone.

## Notas de la implementación
- **Bug encontrado y corregido durante la medición:** el selector se quedaba en "Buscando…" si la receta ya alcanzaba (no hay plan); ahora distingue "calculando" de "sin consejo".
- Con consejo completo disponible, el aviso del paso 3 muestra **solo el plan** (los motivos "tu color es más claro: probá sumar blanco" se contradecían con "te faltan Amarillo y Azul"); sin plan se muestran los motivos de siempre. El motivo de tono (`need_hue`) ya no tiene frase propia.
- Las sugerencias de a uno y el plan llegan **juntos** (`Promise.all`) para que los botones no cambien a mitad de camino.
- `result.plan` es nuevo en `mixStore`; `suggestions` se conserva como respaldo si el plan falla.
- El "Antes" del editor se recalcula con `mixHex` de la mezcla guardada (no con `result_hex`) para que, al abrir, antes y ahora coincidan siempre.

## Riesgos y preguntas abiertas
- **Sobrescribir pierde la versión anterior** (por eso "Restablecer" mientras editás y "Guardar como copia"). Un historial de versiones queda fuera.
- Mezclar mucho (20 partes × 6) da recetas poco prácticas: el límite de partes es una protección; se puede ajustar.
- El color de "Blanco/Negro estándar" es el de caja de témperas (`referencePaints`), como en el paso 3; si tu blanco real es distinto, el frasco puede variar.
- Si una pintura de la receta se borró de Mis pinturas, la receta igual se edita (usa su copia).
- **Costo del plan (parte B):** hasta 25 combinaciones × un `solve`; con `maxParts` 8 y `maxPaints` 4 debería ser rápido, pero con 6 pinturas elegidas + 3 sumadas el espacio crece: se limita el pool y se mide en Chrome; si tarda, se baja `maxParts` solo para el consejo.
- El plan usa los **colores de referencia** de `referencePaints` (caja de témperas típica): si tus pinturas reales son distintas, el "queda Muy parecido" es una estimación.
- **Decisiones ya tomadas (con tus respuestas):** Más claro/Más oscuro = ±1 parte de blanco/negro; principal "Guardar cambios" + secundario "Guardar como copia"; límite de 6 pinturas y 20 partes; este spec va antes que el onboarding (014).
- **Preguntas (resueltas):**
  1. ¿Te cierra que **Más claro / Más oscuro** sean atajos de "+1 parte de blanco / negro" (y no un cálculo automático)?
  2. ¿Guardar: principal **"Guardar cambios"** (sobrescribe) + secundario **"Guardar como copia"**, como propongo? ¿O preferís que por defecto sea copia?
  3. ¿Límite de **6 pinturas** y **20 partes** por pintura te sirve?
  4. Este spec no depende de nada pendiente (015 y 016 ya están subidos). El **014 (onboarding)** sigue en borrador y debería mencionar esta función al implementarse: ¿cuál hacemos primero?
