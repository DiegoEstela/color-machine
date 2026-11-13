# 007 — Layout compacto: sin scroll en el paso 1, sin botón "Salir" feo, título más chico

- **Estado:** implementado (medido en Chrome con emulación móvil; falta confirmar en un teléfono real)
- **Fecha:** 2026-11-13

## Objetivo
Que la rueda de color, el color elegido y el botón "Siguiente" entren **juntos en una sola pantalla de celular sin scroll**, achicando títulos, espacios y controles. Además, sacar el botón "Salir" de texto y su barra superior, que ocupan lugar y no se ven bien.

## Alcance
- Incluye:
  - Quitar la barra superior fija con el botón "Salir" (`App.jsx`) y liberar ese alto.
  - Cerrar sesión desde un **botón de ícono pequeño y discreto** dentro de la cabecera del asistente (ver decisiones).
  - Cabecera compacta del asistente: título más chico, "Paso N de 3" y la barra de progreso en una sola fila.
  - Escala de tamaños más chica en tokens (fuente de títulos, espaciados del asistente, alto táctil de 44 px en vez de 48).
  - Paso 1 en una sola pantalla: pestañas Rueda / Foto, rueda y vista del color **lado a lado**, control de **Claridad** siempre visible, **Matiz y Saturación** dentro de un plegable "Ajuste fino" (siguen disponibles para teclado y lectores de pantalla), campo hex y "Siguiente".
  - Pestaña Foto del paso 1 ajustada al mismo alto disponible (foto con altura máxima relativa a la pantalla).
- No incluye: cambios de contenido de los pasos 2 y 3 (listas largas pueden hacer scroll), un menú de usuario completo, modo horizontal especial.

## Plan
1. **Medir primero.** Abrir la app en un navegador con viewports de 360x640, 390x844 y 360x560, y registrar el alto que ocupa hoy cada bloque del paso 1 para saber cuánto hay que recortar.
2. Tokens: reducir `--text-lg`/`--text-xl` para títulos de pantalla, definir `--touch-min: 44px`, y una escala compacta de espacios. Nada fuera de `tokens.css`.
3. `WizardLayout`: cabecera en una fila (título pequeño a la izquierda; "Paso N de 3" y barra a la derecha o debajo en una línea), botón de ícono "Salir" a la derecha con zona táctil de 44 px, contenedor `min-height: 100dvh` en columna, sin padding sobrante.
4. Átomo `PixelIcon`: sumar el ícono `exit` (8x8) y usarlo como botón con `aria-label="Cerrar sesión"`.
5. `ColorWheel`: tamaño en función del alto disponible (`min(ancho disponible, 36dvh)`), Claridad visible y Matiz/Saturación dentro de `<details>` "Ajuste fino".
6. `TargetColorPicker`: rueda y vista del color en una fila (la vista con el hex debajo); "Siguiente" siempre al pie; la miniatura del recorte, si existe, entra dentro de la misma fila.
7. `App.jsx`: eliminar la barra superior y su botón de texto.
8. Verificar en navegador a 360x640, 390x844 y 360x560 que `document.documentElement.scrollHeight <= window.innerHeight` en el paso 1 (pestañas Rueda y Foto) y revisar el aspecto de pasos 2 y 3.
9. Tests de lo que tenga lógica (p. ej. el botón de cerrar sesión y el plegable), `npm test`, `npm run lint`, `npm run build`.

## Archivos a crear/modificar
- `src/styles/tokens.css`
- `src/components/atoms/PixelIcon/icons.js` (ícono `exit`)
- `src/components/templates/WizardLayout/` (cabecera compacta + cerrar sesión)
- `src/components/molecules/ColorWheel/` (tamaño y "Ajuste fino")
- `src/components/organisms/TargetColorPicker/` (fila rueda + vista)
- `src/components/molecules/PhotoCropper/`, `PhotoColorPicker/` (alto máximo relativo a la pantalla)
- `src/App.jsx`, `src/App.module.css`
- `src/pages/Catalog/Catalog.jsx` (mostrar el ícono nuevo)

## Atomic design
- Átomo: ícono `exit` en `PixelIcon`.
- Template `WizardLayout` pasa a incluir la acción de cerrar sesión (recibe `onSignOut`, sin conocer Supabase).
- Moléculas `ColorWheel` y organismo `TargetColorPicker` cambian solo de presentación y distribución.

## Datos (Supabase)
No aplica.

## Criterios de aceptación
- [x] En 360x640, 390x844 y 360x560 el paso 1 en Rueda no genera scroll (antes: 1015 px de alto en una ventana de 640). En Foto tampoco a 360x640 y 390x844, ni siquiera con una foto vertical de 1200x1600; a 360x560 sobran 47 px de scroll, dentro del scroll mínimo aceptado para pantallas muy bajas.
- [x] La barra superior y el botón "Salir" de texto ya no existen; cerrar sesión sigue siendo posible desde un ícono pequeño con zona táctil de 44 px y `aria-label`.
- [x] El título es visiblemente más chico y comparte fila con el indicador de paso.
- [x] Matiz y Saturación siguen accesibles dentro de "Ajuste fino" y con teclado.
- [x] Contraste AA y objetivos táctiles >= 44 px se mantienen; sin animaciones con `prefers-reduced-motion`.
- [x] Los pasos 2 y 3 no se rompen (pueden hacer scroll).
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Pantallas bajas.** En 360x560 hay muy poco alto: la rueda se achica y puede quedar difícil de usar. Se fija un tamaño mínimo y, por debajo de eso, se permite un scroll mínimo antes que una rueda inutilizable.
- **Barras del navegador móvil.** `100dvh` se adapta al alto visible, pero hay que probar en un iPhone y un Android reales.
- **Dónde cerrar sesión.** Propongo un ícono pequeño en la cabecera. Si preferís **sacarlo del todo** ahora y ponerlo luego en una pantalla de "Mi cuenta" o en la biblioteca, se hace en este mismo spec. ¿Cuál prefieres?
- **Más chico, menos cómodo.** Reducir tamaños y alturas táctiles tiene un límite: se mantiene el mínimo de 44 px en lo que se toca.

## Resultado de la medición (360x640, alto del documento)
- Antes: paso 1 Rueda 1015 px (+375 de scroll); Foto 771 px (+131).
- Después: Rueda 640 px y Foto 640 px, sin scroll; "Siguiente" termina en y=495 (Rueda) y y=609 (Foto con foto vertical).
- Botón de cerrar sesión: 44x44 px, solo ícono, con `aria-label` "Cerrar sesión".
