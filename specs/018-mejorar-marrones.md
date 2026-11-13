# 018 — Para acercarte más: que la app diga qué agregar o cambiar (marrones y todo color)

- **Estado:** implementado (medido en Chrome con emulación móvil y tests; falta probarlo con tus pinturas y tu marrón reales)
- **Fecha:** 2026-11-14

## Objetivo
Que cuando la mezcla "se parece pero podría estar más cerca" —por ejemplo un **marrón con rojo, amarillo y azul**— la app te diga **con claridad y arriba de todo** qué tendrías que **agregar** o **cambiar** para acercarte, y **cuánto mejoraría** con cada cosa. Hoy:
- El consejo de qué sumar **solo aparece si el parecido es peor que "Muy parecido"** (ΔE ≥ 5): en el rango "Parecido/Muy parecido" mejorable no dice nada.
- Cuando aparece, está **al final de la receta** (hay que bajar para verlo).
- **No dice hacia dónde tira** la mezcla (más azulada, más clara…) ni sugiere **cambiar la precisión**, que a veces alcanza.

## Lo que contaste y lo que se midió
Tus pinturas: **rojo, amarillo y azul** (sin blanco ni negro). Tu caso: *"una foto me da algo parecido pero podría estar más cerca"*, y querés que te diga **qué cambiar o agregar**.

Se corrió el solver actual (Normal, 10 partes) con solo esos tres primarios para varios marrones, y qué pasa al sumar lo que falta (consejo completo):

| Marrón buscado | Hoy (R + A + Az) | Qué falta | Con eso | Receta nueva |
|---|---|---|---|---|
| Medio `#8b5a2b` | 5,1 · "Parecido" | **Negro** | 3,3 · "Muy parecido" | 1 R + 3 A + 4 Negro |
| Chocolate `#5c3a21` | 8,3 | **Negro** | 4,7 | 1 R + 2 A + 5 Negro |
| Claro `#a67b5b` | 6,9 | **Blanco** | 1,6 · "Casi idéntico" | 1 R + 2 A + 2 Az + 2 Blanco |
| Tostado `#c19a6b` | 9,1 | **Blanco** | 4,2 | 1 R + 3 A + 2 Az + 3 Blanco |
| Rojizo `#7b3f20` | 6,8 | Negro (poco) | 6,0 | 2 R + 3 A + 5 Negro |

**Conclusiones que guían este spec:**
1. **Con solo los tres primarios hay un techo** (ΔE 5–9 en marrones): para un marrón **oscuro** falta **negro** y para uno **claro**, **blanco**. La app ya lo calcula (`planMissingPaints`), pero lo muestra tarde y solo si ΔE ≥ 5.
2. **Un solo paso de "+1 parte" casi no mejora** (por ejemplo, +1 negro a la receta actual: 5,1 → 5,1). La mejora viene de **armar otra receta completa** con la pinturas que faltan. Por eso el consejo tiene que mostrar **la receta nueva completa**, no "sumale una parte".
3. Subir la precisión a veces ayuda un poco; conviene **decirlo con números** ("con Preciso queda X") en vez de que lo adivines.

## Alcance
- Incluye:
  - **Banner "Para acercarte más"** en el paso 3, **justo debajo de la comparación de frascos** (antes de la lista de pinturas), que aparece cuando el parecido no es "Casi idéntico" (**ΔE ≥ 2**, antes ≥ 5). Con ΔE ≥ 5 viene abierto; entre 2 y 5, plegado en una línea ("Podría estar más cerca: tocá para ver cómo") para no ocupar lugar. Contiene tres cosas, cada una con **cuánto mejora**:
    1. **Cómo está tu mezcla** (en palabras): "Es un poco más clara y tira a azul comparada con tu color." (se suma la **dirección del tono**: tira a rojo / amarillo / verde / azul).
    2. **Qué agregar** (consejo completo ya existente, extendido a ΔE ≥ 2): "Te falta Negro. Con eso queda Muy parecido: 1 Rojo · 3 Amarillo · 4 Negro" + botones **Agregar todos** / **+ Color**.
    3. **Qué cambiar sin agregar nada**: (a) **precisión**: "Con Preciso queda Muy parecido (ΔE 4,2)" con botón "Usar Preciso"; (b) **hacia dónde corregir** con tus propias pinturas: "Tira a azul: probá menos Azul o más Amarillo" (solo nombra pinturas que están en la receta).
  - **Consejo de familia de color** (marrón, gris/apagado, oscuro): nota corta, p. ej. *"Un marrón se hace con rojo, amarillo y azul. Para oscurecerlo usá negro (o un azul muy oscuro); para aclararlo, blanco."*
  - El consejo completo (`planMissingPaints`) pasa a **usar un umbral configurable** (2 en vez de 5): elige el conjunto más chico que lleva a una **categoría mejor** de parecido ("Parecido" → "Muy parecido" → "Casi idéntico") o, si no, el que más mejora (≥ 1 de ΔE).
  - Se actualiza la ayuda del onboarding (tarjeta 5 y ayuda del paso 3).
- No incluye: "Pinturas a usar / Sin negro" (descartado: vos no tenés negro, no aplica; puede volver si lo pedís), **calibración con tu mezcla real** y avisos de "pintura lejana a su color típico" (spec 019, van juntos), más resolución de partes (descartado con datos: casi no mejora), mostrar recetas alternativas del solver, cambios en Supabase.
- **Opcional (a decidir):** botón **"Afinar a mano"** que abre el editor de recetas (spec 017) con la mezcla actual **sin guardar**, para probar ajustes de partes y guardar solo si te gusta. Más trabajo; ver preguntas.

## Plan
1. **Lógica pura, con tests** (`features/color-mixer/`):
   - `advisor.planMissingPaints(target, paints, { maxParts, threshold = 5 })`: el umbral de "necesita ayuda" pasa a ser un parámetro (el paso 3 usa 2). Sin parámetro, igual que hoy (tests existentes iguales). Para ΔE entre 2 y 5 elige la combinación más chica que **sube de categoría** o mejora ≥ 1.
   - `advisor.suggestPrecision(target, paints, { maxParts })` → `{ maxParts, deltaE, quality, recipe } | null`: resuelve con la siguiente precisión (10 → 16; 6 → 10) y solo devuelve algo si mejora ≥ 1 de ΔE o cambia de categoría.
   - `tweak.describeGap` suma `tone` (`'redder' | 'greener' | 'yellower' | 'bluer' | 'same'`, por diferencia a*/b* de Lab, umbral 3) y su frase ("tira a azul").
   - `advisor.adviceForTone(gap, recipeParts)` → frases de corrección con las pinturas de la receta ("probá menos Azul o más Amarillo").
   - `advisor.colorFamilyTip(target)` → `null` o la nota de marrón / gris / oscuro (marrón: tono ~15–50°, L < 60, croma moderado).
2. **Worker y store:** `solver.worker.js` + `solverClient.js` con `kind: 'precision'`; `mixStore.calculate` guarda `result.precision` junto a `plan` y `suggestions` (llegan juntos, `Promise.all`).
3. **UI:** molécula/organismo `ImproveAdvice` ("Para acercarte más": plegable, secciones, botones "Agregar todos", "Usar Preciso"); `MixResult` lo ubica **debajo de `ColorCompare`** y reemplaza el panel amarillo de abajo (su contenido pasa a este banner). `PlanAdvice` se reutiliza.
4. **Onboarding:** actualizar `features/onboarding/steps.js` (tarjeta 5, ayuda del paso 3) y su test.
5. **Verificación en Chrome móvil** (harness temporal, luego borrar): 360×640, 390×844, 360×560, con rojo+amarillo+azul y un marrón `#8b5a2b`, `#5c3a21` y `#a67b5b`: capturas del banner plegado y abierto, medir cuánto baja la lista (spec 015, scroll natural), zonas táctiles.
6. Actualizar `CLAUDE.md`.

## Archivos a crear/modificar
- `src/features/color-mixer/advisor.js` (+ test) — umbral, `suggestPrecision`, `adviceForTone`, `colorFamilyTip`.
- `src/features/color-mixer/tweak.js` (+ test) — `tone` y frases.
- `src/features/color-mixer/solver.worker.js`, `solverClient.js` (+ test), `mixStore.js` (+ test) — `precision` en el resultado.
- `src/components/molecules/ImproveAdvice/` (nuevo), `MixResult.*` (+ tests) — el banner, arriba de la receta.
- `src/features/onboarding/steps.js` (+ test) — textos.
- `CLAUDE.md`, este spec.

## Atomic design
- Molécula nueva **`ImproveAdvice`** (plegable, con secciones); reutiliza `PlanAdvice`, `PixelPanel`, `PixelText`, `PixelButton`. La lógica vive en `features/color-mixer`, sin React.

## Datos (Supabase)
Ninguno. El consejo es del paso 3 y vive en memoria (`mixStore`).

## Criterios de aceptación
- [x] Con rojo + amarillo + azul y un marrón medio (`#8b5a2b`, ΔE 5,1) el banner aparece **debajo de los frascos y antes de la lista de pinturas**, abierto, y dice "te falta: Negro. Con eso queda muy parecido: 1 Rojo · 3 Amarillo · 4 Negro" (ΔE 3,3) con el botón para agregarlo (medido en Chrome).
- [x] Con el marrón claro (`#a67b5b`, ΔE 6,9) dice que falta **Blanco** (queda "casi idéntico", ΔE 1,6); con el chocolate (`#5c3a21`, ΔE 8,3), Negro (ΔE 4,7).
- [x] Entre ΔE 2 y 5 el banner aparece **plegado** en una línea ("Podría estar más cerca · Ver cómo ▾", 44 px de toque, `aria-expanded`); con ΔE ≥ 5 viene abierto; con ΔE < 2 no aparece (tests y Chrome).
- [x] "Cómo está tu mezcla" nombra la **dirección del tono** ("Y tira a azul") además de claridad e intensidad, y "qué cambiar" nombra solo pinturas de la receta ("Tira a azul: probá menos Azul o más Amarillo"; con pinturas de otro nombre usa el tuyo).
- [x] Si una precisión mayor mejora ≥ 1 de ΔE o sube de categoría, ofrece "Usar Preciso" con lo que lograría ("Con Preciso queda muy parecido: 3 Rojo · 6 Amarillo · 5 Azul"); si no mejora (chocolate), no aparece.
- [x] El consejo de marrones aparece para los 5 marrones probados y no para colores vivos o claros (test con 6 colores); también hay consejo para grises y muy oscuros.
- [x] Sin consejo posible nunca queda mudo: dice lo más cerca que se llega ("Con tus pinturas y la caja base lo más cerca que se llega es muy parecido.").
- [x] Con el umbral por defecto (5) `planMissingPaints` da lo mismo que antes (test); los 735 tests previos siguen en verde.
- [x] Medido en 360×640, 390×844 y 360×560: el banner abierto mide 214–277 px (260 a 390 de ancho) y la lista baja lo que ocupe (spec 015, scroll natural: 253/190 px a 360×640, 0 a 390×844 con el chocolate); plegado mide 62 px. Zona táctil del botón de plegar ≥ 44 px. Accesible: nota con nombre, secciones con título, voseo.
- [x] Onboarding actualizado (tarjeta 5 "Para acercarte más" y ayuda del paso 3); tests nuevos; `npm test` (776), `npm run lint` y `npm run build` pasan.
- [ ] Pendiente de probar con tus pinturas y tu marrón reales.

## Notas de la implementación
- El banner **reemplaza** al panel amarillo que estaba al final de la receta (su contenido pasó acá) y vive dentro de la zona del resultado, entre los frascos y la lista.
- `mixStore.result` suma `precision` y `adviceReady` (el consejo y la precisión llegan juntos con `Promise.all`); mientras no llega el consejo se muestra "Buscando qué colores te faltan..." o los botones de siempre como respaldo.
- El plan para ΔE 2–5 elige el conjunto más chico que **sube de categoría** de parecido; si ninguno mejora al menos 1 de ΔE, devuelve `roles` vacíos y el banner dice lo más cerca que se llega.
- El tono ("tira a…") se mide en el plano a-b de Lab con el eje dominante; es lo que le **sobra** a la mezcla, y lo que falta es lo contrario.
- No se hizo "Afinar a mano", la calibración con la mezcla real ni el aviso de pinturas lejanas (spec 019), como se acordó.

## Riesgos y preguntas abiertas
- Los números salen del **modelo de mezcla** (`spectral.js`) con los colores de referencia del negro y el blanco; con tus pinturas reales pueden variar. Por eso va el spec 019 (calibración con tu mezcla real).
- Mostrar más consejos puede abrumar: por eso el banner va plegado entre ΔE 2 y 5 y las frases son cortas.
- Subir de 10 a 16 partes aumenta el costo de cálculo: se mide (≈ 60 ms con 5 pinturas) y corre en el Worker.
- **Preguntas:**
  1. ¿Te cierra el banner **"Para acercarte más"** debajo de los frascos (cómo está / qué agregar / qué cambiar), plegado cuando ya es "Muy parecido"?
  2. ¿Querés también **"Afinar a mano"** en el paso 3 (abre el editor con tu mezcla actual para probar partes sin guardar), o con el banner alcanza por ahora?
  3. ¿Dejamos la **calibración con tu mezcla real** (y el aviso de pinturas lejanas) para un spec 019?
  4. El **onboarding (014)** sigue sin commit: ¿lo subimos ahora con `/ship` y hacemos esto después, o va todo junto?
