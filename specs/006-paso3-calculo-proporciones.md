# 006 — Paso 3: calcular las proporciones de la mezcla

- **Estado:** implementado (verificado con tests y en Chrome con emulación móvil; falta probar con pinturas reales en un teléfono)
- **Fecha:** 2026-11-13

## Objetivo
Con el color objetivo (paso 1) y las pinturas elegidas (paso 2), calcular **cuántas partes de cada pintura** hay que mezclar para acercarse lo más posible al objetivo, por ejemplo "2 partes de rojo, 1 de azul". El resultado se muestra con una comparación visual (objetivo vs. mezcla) y una indicación honesta de qué tan parecido es. Todo se calcula en el dispositivo, **sin IA**.

## Alcance
- Incluye:
  - **Consejero de pinturas** (sin IA): según el color objetivo, indica qué pinturas base conviene tener ("Para este violeta te conviene tener: Rojo, Azul y Blanco"), marca cuáles ya tiene el usuario y cuáles le faltan, y deja agregarlas con un toque. Se muestra en el paso 2 y se reutiliza en el paso 3 cuando las pinturas elegidas no alcanzan.
  - Motor de mezcla puro y testeado (`features/color-mixer/`): simula la mezcla de pigmentos con `spectral.js` (Kubelka-Munk) y busca la combinación de partes enteras con menor diferencia de color (ΔE 2000 de `culori`).
  - Receta **recomendada** (la más simple que queda prácticamente igual de cerca que la mejor), receta **más exacta** y hasta 2 alternativas, cada una con sus partes y su calidad.
  - Pantalla del paso 3: estado "mezclando...", comparación objetivo / resultado, lista de partes con barras, calidad en palabras y avisos cuando las pinturas no alcanzan.
  - Animación pixel art **básica** de mezcla (burbujas y revelado del color), sin movimiento si el usuario tiene `prefers-reduced-motion`.
  - Selector de precisión (cantidad máxima de partes).
- No incluye: guardar la receta con nombre y la biblioteca (próximo spec), conversión a mililitros, animaciones elaboradas del proceso (pulido posterior), calibrar el modelo con la mezcla real del usuario.

## Plan
1. **Verificar `spectral.js` en Vite.** Es un paquete UMD/CommonJS sin ESM ni tipos (exporta `Color`, `mix`, `palette`, `gradient`). Confirmar que el import funciona en dev, en el build y en los tests; si no, importarlo con un envoltorio en `lib/spectral.js`. `mix([color, partes], ...)` normaliza números enteros, que es justo lo que necesitamos.
2. `features/color-mixer/mixer.js`:
   - `mixHex(entries)` → hex resultante de `[{ hex, parts }]` (ignora las de 0 partes).
   - `deltaE(hexA, hexB)` con `differenceCiede2000` de `culori`.
3. `features/color-mixer/solver.js`:
   - `enumerateRecipes(count, maxParts)`: genera todas las composiciones de partes enteras (>= 1 parte en total, hasta `maxParts`), **solo las primitivas** (se descartan múltiplos como 2:2 que repiten 1:1) para reducir trabajo.
   - `solve({ target, paints, maxParts = 10 })` → `{ best, simplest, alternatives }`. Cada receta: `{ parts: [{ paintId, name, hex, parts }], total, mixHex, deltaE, quality }`. Es determinista.
   - **Recomendada** = la de menos partes totales cuyo ΔE <= (mejor ΔE + 1). Si hay empate, la de menor ΔE.
   - **Alternativas**: las 2 mejores adicionales con menos partes o distinto reparto (sin repetir el mismo resultado visual, ΔE entre mezclas < 1).
   - `describeQuality(deltaE)` → "Casi idéntico" (< 2), "Muy parecido" (< 5), "Parecido" (< 10), "Aproximado" (>= 10).
   - `diagnose(target, bestMix)` → avisos: "Probá sumar blanco" / "Probá sumar negro" según la diferencia de claridad, o "Falta una pintura de tono X" según el matiz, con umbrales documentados.
4. **Consejero** (`features/color-mixer/advisor.js` + `referencePaints.js`):
   - Paleta de referencia con las pinturas base de una caja de témperas: **Rojo, Amarillo, Azul, Blanco y Negro** (hex típicos de pigmento, ajustables en un solo archivo).
   - `adviseBasePaints(target)`: resuelve el mismo problema del solver pero con la paleta de referencia (5 pinturas) y devuelve las **pinturas base que usa la receta recomendada**, es decir el conjunto mínimo (por ejemplo violeta → Rojo + Azul; rosa pastel → Rojo + Blanco; gris → Blanco + Negro).
   - `matchPaints(advice, userPaints)`: para cada pintura base indica si el usuario ya la tiene (su pintura guardada cuyo color más se acerca a esa base, con un umbral de ΔE) o le falta. Una misma pintura del usuario no cubre dos bases.
   - `suggestAdditions(target, selectedPaints)` (paso 3): si el mejor ΔE es >= 5, prueba sumar cada pintura base de a una y recomienda la que más acerca el resultado ("Para acercarte más, sumá un Blanco").
   - La molécula `PaintAdvice` muestra el consejo con chips (swatch + nombre + "la tenés" / "Agregar"); "Agregar" abre el alta de pintura con el nombre ya cargado (el usuario le saca la foto a su frasco real).
5. **Rendimiento:** con 6 pinturas y 10 partes máximas son ~8 000 combinaciones. Medir en test. Si el solver tarda más de ~250 ms en el móvil, moverlo a un **Web Worker** (`new Worker(new URL(...), { type: 'module' })`); de lo contrario correrlo en el hilo principal tras un `setTimeout` para que se pinte "Mezclando...".
6. Store: `mixStore` suma `result` (receta elegida), `maxParts` y `selectRecipe(index)`; se invalida si cambian el objetivo o las pinturas.
7. UI (atomic design):
   - Molécula `RecipeRow`: swatch de la pintura + nombre + "N partes" + `PixelBar`.
   - Molécula `ColorCompare`: dos swatches grandes (objetivo / tu mezcla) con ΔE en palabras.
   - Molécula `MixingAnimation`: burbujas pixel con `steps()` y revelado del color; estática con `prefers-reduced-motion`.
   - Organismo `MixResult`: arma todo con las pestañas "Recomendada / Más exacta / Otras", los avisos y el selector de precisión (Simple, Normal, Preciso = 6, 10, 16 partes).
   - La página `Create` monta `MixResult` en el paso 3 y mantiene "Volver".
8. Tests, `npm test`, `npm run lint`, `npm run build` y prueba en móvil con pinturas reales.

## Archivos a crear/modificar
- `src/features/color-mixer/mixer.js`, `solver.js`, `advisor.js`, `referencePaints.js` y sus tests
- `src/features/color-mixer/mixStore.js` (+ test)
- `src/lib/spectral.js` (solo si el import directo no funciona)
- `src/components/molecules/RecipeRow/`, `ColorCompare/`, `MixingAnimation/`, `PaintAdvice/` y `index.js`
- `src/components/organisms/MixResult/` y `index.js`
- `src/styles/animations.css` (keyframes pixel con tokens de tiempo) importado desde `main.jsx`
- `src/components/organisms/PaintsStep/` y `PaintCapture/` (consejo y alta con nombre sugerido)
- `src/pages/Create/Create.jsx`

## Atomic design
- Átomos reutilizados: `PixelBar`, `ColorSwatch`, `PixelText`, `PixelPanel`, `PixelButton`.
- Moléculas nuevas: `RecipeRow`, `ColorCompare`, `MixingAnimation`, `PaintAdvice`.
- Organismo nuevo: `MixResult`.
- La matemática y el solver viven en `features/color-mixer`, sin React.

## Datos (Supabase)
No aplica en este spec: el resultado vive en el store. Al guardar (próximo spec) se escribirá en `recipes`: `target_hex`, `result_hex` y `mix = [{ name, hex, parts }]` (ya definido en el spec 002, hasta 12 elementos).

## Criterios de aceptación
- [x] Violeta como objetivo → el consejo pide Rojo y Azul; rosa pastel → Rojo y Blanco; gris → Blanco y Negro; un color igual a una pintura base → solo esa (tests con colores conocidos).
- [x] En el paso 2 el consejo marca "la tenés" para las bases que el usuario ya guardó y "Agregar" para las que faltan; una pintura no cubre dos bases.
- [x] "Agregar" abre el alta con el nombre sugerido y, al guardar, el consejo se actualiza.
- [x] En el paso 3, si ΔE >= 5, aparece una sugerencia concreta de qué pintura sumar y, al sumarla, el resultado mejora (test).
- [x] Dos pinturas, una igual al objetivo: la receta es "1 parte" de esa pintura sola (ΔE ~ 0), sin mezclar de más.
- [x] Rojo + azul (objetivo violeta) devuelve ambas pinturas con partes enteras > 0 y ΔE menor que usar solo una (test con colores conocidos).
- [x] La receta recomendada nunca tiene más partes que la más exacta y su ΔE no supera el de la mejor en más de 1.
- [x] Las recetas devueltas son primitivas (no aparecen 2:2 ni 4:2) y el resultado es determinista.
- [x] Con 6 pinturas y el máximo de partes por defecto, el cálculo tarda menos de 1 s en los tests y menos de ~250 ms en el móvil (si no, se usa un Worker).
- [x] El texto de calidad coincide con los umbrales (< 2, < 5, < 10, >= 10).
- [x] Si las pinturas no alcanzan, se muestra un aviso útil ("Probá sumar blanco", etc.) en lugar de presentar el resultado como bueno.
- [x] Cambiar el selector de precisión recalcula; volver y cambiar el objetivo o las pinturas descarta el resultado anterior.
- [x] La animación respeta `prefers-reduced-motion`; sin scroll horizontal a 360 px; objetivos táctiles >= 44 px.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Es una aproximación.** `spectral.js` modela pigmentos genéricos; las témperas reales varían por marca, opacidad y cómo cambian al secarse. Además el color de cada pintura sale de una foto. El resultado se presenta como guía y se recomienda hacer una prueba pequeña antes de mezclar todo.
- **Partes enteras pequeñas.** Con un máximo bajo, algunos colores no se alcanzan con precisión; el selector de precisión y el aviso de "más exacta" lo hacen visible. ¿Aprobás 6 / 10 / 16 partes y 10 por defecto?
- **Pinturas insuficientes.** Sin blanco no se logran tonos claros, sin negro no se logran oscuros, y sin un primario faltan tonos. Los avisos son heurísticos y se pueden afinar.
- **Compatibilidad del paquete.** `spectral.js` no tiene ESM ni tipos; si el build de Vite lo trata mal, se aísla en `lib/spectral.js`.
- **Animación acotada.** Aquí solo va una animación simple; la animación más elaborada del proceso (frascos que se vierten, etc.) queda para un spec de pulido. ¿Te parece bien?
- **Cantidades (ml o gotas)** no están incluidas. ¿Querés que el próximo spec sume un calculador del tipo "quiero 100 ml"?

## Notas de implementación
- **Importación de `spectral.js`:** el import directo (`import { Color, mix } from 'spectral.js'`) funciona en los tests y en el build de producción, también dentro del Worker. No hizo falta `lib/spectral.js`. No se probó en modo `npm run dev`.
- **Rendimiento (medido):** en Node, 6 pinturas y 10 partes = 33 ms; 16 partes = 136 ms. En Chrome (build de producción, emulación móvil) la pantalla completa con 6 pinturas y 16 partes quedó lista en ~205 ms, y con 10 partes en ~104 ms. Aun así el cálculo corre en un **Web Worker** (`solver.worker.js`) para que la animación no se congele en teléfonos más lentos; si el Worker no está disponible o falla, se calcula en el hilo principal.
- **Máximo de 4 pinturas distintas por receta** (`DEFAULT_MAX_PAINTS`): no estaba en el spec. Reduce las combinaciones (con 6 pinturas y 16 partes pasa de ~74 000 a ~37 000) y evita recetas poco prácticas.
- **Pestañas del resultado:** `recipeKey` vale `recommended`, `best` u `others` (las alternativas se ven juntas en "Otras").
- **Sugerencias:** además de ΔE >= 5, una pintura solo se sugiere si acerca >= 3 de ΔE o sube la categoría de calidad (`MIN_IMPROVEMENT`), y usan la misma precisión que el cálculo principal.
- **Animación:** los keyframes viven en `MixingAnimation.module.css`; no se creó `styles/animations.css`. Con `prefers-reduced-motion` la animación queda en `none` (verificado en Chrome).
- **Medido a 360x640 (build de producción):** sin scroll horizontal; el paso 3 puede hacer scroll vertical.
- **Pinturas reales:** con un rojo oscuro como `#c1121f` y un azul, un violeta vivo queda en ΔE ~11 ("Aproximado") y el sistema lo avisa en vez de sugerir algo que no ayuda; un rojo más magenta daría un violeta más fiel.
