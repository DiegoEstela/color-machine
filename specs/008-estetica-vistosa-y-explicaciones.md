# 008 — Estética más vistosa y explicaciones claras en el paso 3

- **Estado:** implementado (medido en Chrome con emulación móvil; falta que lo veas en tu teléfono y pidas ajustes)
- **Fecha:** 2026-11-14

## Objetivo
1. Que la app **se vea más atractiva y con personalidad de juego pixel art**, sin perder lo que ya funciona (todo entra en pantalla, pastel, los colores del usuario como lo más saturado).
2. Que en el **paso 3 se entienda qué hace cada botón**: "Simple / Normal / Preciso" y "Recomendada / Más exacta / Otras" pasan a tener un título, una descripción corta y una explicación de lo que quedó elegido.

## Qué está flojo hoy (por capturas a 360x640)
- Todo es blanco sobre crema con el mismo borde grueso: no hay jerarquía ni "momentos" que llamen la atención.
- La cabecera es solo texto y una barra; no hay identidad (logo, íconos de pasos).
- Los colores del usuario (lo importante) aparecen como cuadrados planos, sin un objeto que los contenga.
- En el paso 3 hay dos filas de botones sin título ni explicación, y aparece "ΔE 11.5", que nadie entiende.

## Alcance
- Incluye:
  - **Tokens y fondo:** fondo crema con un patrón sutil de puntos (dither) y nuevos acentos pastel (cielo, durazno). Sombras y biseles pixel más marcados.
  - **Identidad:** logo pixel (una olla de pintura con gotas) en la cabecera y en la pantalla de acceso; título de pantalla con más presencia sin ocupar más alto.
  - **Indicador de pasos con íconos** (rueda, frascos, olla) en lugar de "1/3" y la barra: pasos hechos, actual y pendientes.
  - **Paneles con barra de título** (estilo ventana de juego) y tonos por sección.
  - **Botones con ícono** y un botón principal más vistoso (bisel claro arriba, oscuro abajo); selección con un pequeño "rebote".
  - **Frasco pixel (`PixelJar`)** que contiene el color: se usa para las pinturas del paso 2 y para el resultado del paso 3, de modo que el color sea el protagonista.
  - **Revelado de la mezcla** en el paso 3: el color "salta" al aparecer y salen destellos pixel. Se respeta `prefers-reduced-motion`.
  - **Explicaciones del paso 3** (ver abajo) y calidad con un **medidor** de 4 segmentos en lugar del ΔE visible.
  - **Pantalla de acceso** con logo y panel con barra de título.
  - Transición breve entre pasos.
- No incluye: modo oscuro, sonidos o vibración, mascota animada, cambios de lógica de color, nuevas pantallas (biblioteca y guardado van en otro spec).

## Explicaciones del paso 3
Dos grupos, cada uno con **título, opciones con subtítulo y una frase que describe la opción elegida**:

**1. "¿Qué tan exacta querés la receta?"** (antes "Simple / Normal / Preciso")
| Opción | Subtítulo | Frase al elegirla |
|---|---|---|
| Simple | hasta 6 partes | "Recetas cortas y fáciles de medir, aunque el color puede variar un poco." |
| Normal | hasta 10 partes | "Equilibrio entre facilidad y parecido." |
| Preciso | hasta 16 partes | "El color más parecido posible, pero con más partes que medir." |

**2. "¿Qué receta querés ver?"** (antes "Recomendada / Más exacta / Otras")
| Opción | Subtítulo | Frase al elegirla |
|---|---|---|
| Recomendada | la más simple | "La más simple que queda casi igual de cerca que la mejor." |
| Más exacta | la que más se parece | "La que más se acerca a tu color, aunque lleve más partes." |
| Otras | variantes | "Recetas distintas con un parecido similar, por si te falta alguna pintura." |

Además:
- Una línea fija bajo la receta: **"1 parte = la medida que quieras (una cucharada, una tapita). Usá la misma para todas las pinturas."**
- El parecido se muestra con un **medidor de 4 segmentos** ("Casi idéntico / Muy parecido / Parecido / Aproximado"). El ΔE queda solo para lectores de pantalla y para tests.
- Se mantiene el aviso "Es una aproximación…".

## Plan
1. **Capturar el "antes"** con Chrome de pruebas en 360x640 y 390x844 (pasos 1, 2, 3 y acceso) para comparar. Medir el alto del documento en el paso 1 (hoy 640, sin scroll).
2. **Tokens y estilos globales:** nuevos acentos, patrón de fondo (solo con CSS y tokens), sombras y biseles; verificar contraste AA de todo el texto sobre cada tono con el script de contraste.
3. **Átomos:**
   - `PixelLogo` (SVG de cuadrícula).
   - `PixelSparkle` (destello de 4 puntas).
   - `PixelJar` (frasco con el color y brillo pixel; tamaños sm / md / lg).
   - `PixelPanel`: prop `title` (barra de título) y tonos nuevos.
   - `PixelButton`: prop `icon` y bisel; `PixelIcon`: íconos nuevos (rueda, frasco, olla, info).
   - `PixelBar` o nuevo `PixelMeter`: medidor de calidad de 4 segmentos.
4. **Moléculas:**
   - `StepIndicator` con íconos y estados (reemplaza la barra y el "N/3" en `WizardLayout`).
   - `OptionGroup`: título + opciones (`role="radiogroup"`, navegables con teclado) con subtítulo y frase descriptiva de la opción activa. Se usa en el paso 3 y también para "Recorte / Punto" del paso 1.
   - `PaintCard` con `PixelJar`; `ColorCompare` con frascos y medidor; `MixingAnimation` con destellos y revelado.
5. **Pantallas:** actualizar `WizardLayout` (cabecera con logo + indicador), paso 1 (ventana con título, vista del color con brillo), paso 2 (consejo con destellos y frascos), paso 3 (los dos `OptionGroup`, revelado, medidor, nota de "1 parte"), pantalla de acceso, transición entre pasos.
6. **Capturar el "después"**, comparar, ajustar y repetir hasta que el paso 1 siga entrando sin scroll.
7. Tests y `npm test`, `npm run lint`, `npm run build`.

## Archivos a crear/modificar
- `src/styles/tokens.css`, `global.css` y `animations.css` (keyframes con tokens de tiempo)
- `src/components/atoms/`: `PixelLogo`, `PixelSparkle`, `PixelJar`, `PixelMeter` (nuevos); `PixelPanel`, `PixelButton`, `PixelIcon`, `ColorSwatch` (cambios)
- `src/components/molecules/`: `StepIndicator`, `OptionGroup` (nuevos); `PaintCard`, `ColorCompare`, `MixingAnimation`, `PaintAdvice`, `RecipeRow` (cambios)
- `src/components/organisms/`: `MixResult`, `TargetColorPicker`, `PaintsStep`, `AuthForm`
- `src/components/templates/WizardLayout/`
- `src/pages/Auth/`, `src/pages/Create/`, `src/pages/Catalog/` (mostrar lo nuevo)

## Atomic design
- Átomos nuevos: `PixelLogo`, `PixelSparkle`, `PixelJar`, `PixelMeter`.
- Moléculas nuevas: `StepIndicator`, `OptionGroup`.
- Organismos y plantilla: solo cambian de presentación y textos; la lógica de color y el solver no se tocan.

## Datos (Supabase)
No aplica.

## Criterios de aceptación
- [x] En el paso 3 cada grupo de botones tiene título, subtítulo por opción y una frase que explica la opción elegida; la frase cambia al elegir otra.
- [x] La explicación de "1 parte" está visible en el paso 3 y no aparece el "ΔE" en pantalla (sí en el texto accesible).
- [x] El logo, el indicador de pasos con íconos y las ventanas con barra de título se ven en los tres pasos y en el acceso.
- [x] Las pinturas (paso 2) y el resultado (paso 3) se muestran dentro de un frasco pixel con el color como protagonista.
- [x] El resultado del paso 3 tiene revelado con destellos; con `prefers-reduced-motion` queda estático (verificado en Chrome).
- [x] El paso 1 sigue sin scroll en 360x640, 390x844 y 360x560 (Rueda) y a 360x640 y 390x844 (Foto), medido en Chrome.
- [x] Contraste de texto >= 4.5:1 sobre cada fondo nuevo (calculado); objetivos táctiles >= 44 px; sin scroll horizontal a 360 px.
- [x] Los grupos de opciones se pueden usar con teclado (flechas) y lectores de pantalla (`radiogroup`).
- [x] Capturas "antes y después" a 360x640 de los tres pasos y el acceso, mostradas al usuario.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Espacio del paso 1.** Una cabecera más vistosa puede volver a generar scroll; el banner tendrá un alto máximo (~56 px) y se mide después de cada cambio.
- **Demasiada decoración.** Lo que más debe llamar la atención son los colores del usuario; los adornos son pastel y chicos, y la UI nunca será más saturada que un color elegido.
- **Subjetividad.** "Vistoso" es una opinión: se trabaja con capturas antes y después y se ajusta con tu feedback antes de dar el spec por cerrado.
- **Rendimiento de animaciones** en teléfonos modestos: solo `transform` y `opacity`, con `steps()` para el look pixel.
- **Preguntas para vos:**
  1. **Dirección visual:** A) *Retro cálido* (crema con puntos, ventanas con barra de título, frascos) — recomendada; B) *Más colorido* (fondos pastel por paso, banners grandes). B ocupa más pantalla.
  2. **Logo:** ¿te gusta una olla de pintura pixel con gotas como logo, o preferís otro motivo (paleta, pincel, gota)?

## Resultado y notas de implementación
- **Capturas "antes y después" a 360x640** (en la carpeta de capturas de la sesión): `antes-acceso.png`, `antes-paso1.png`, `antes-paso1-foto.png`, `antes-paso2.png`, `antes-paso3.png` y las equivalentes `despues-*.png`, más `largo-paso2.png` y `largo-paso3pastel.png` con el paso 2 y 3 completos.
- **Scroll medido (360x640, build de producción):** acceso, paso 1 (Rueda y Foto con foto vertical) y "mezclando" sin scroll; sin scroll horizontal en ninguna pantalla. Los pasos 2 y 3 hacen scroll vertical (listas y explicaciones), como estaba previsto.
- **Contraste calculado (peor caso, con puntos y barras de título):** todos >= 4.9:1; ninguno por debajo de 4.5:1.
- **Movimiento reducido (medido en Chrome):** 0 elementos animados en acceso, paso 1, paso 3 y "mezclando"; sin la preferencia hay entre 2 y 14.
- **Desvíos del plan:**
  - Los keyframes (`pop`, `twinkle`, `bounce`, `enter`, `pulse`, `rise`) viven en el CSS de cada componente porque CSS Modules localiza los nombres; no se creó `styles/animations.css`. Los tiempos sí salen de tokens (`--dur-pop`, `--dur-enter`, `--dur-twinkle`).
  - El medidor es un átomo nuevo `PixelMeter` y `PixelBar` quedó para las proporciones por pintura.
  - Los dibujos pixel (logo, destello, frasco) viven en `grid.js` dentro de cada átomo, con tests de forma.
  - La etiqueta del paso actual ya no se muestra al lado del ícono (no entraba en 360 px); el nombre del paso está en la barra de título y en el texto accesible.
  - `PixelText` ahora combina la clase extra con la suya (antes un `className` la pisaba).
