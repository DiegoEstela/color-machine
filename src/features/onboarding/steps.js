/**
 * Contenido del onboarding y de la ayuda por pantalla, todo en un solo lugar (voseo, frases cortas).
 * `art` nombra la mini escena pixel que dibuja `OnboardingArt`.
 */

/** Ilustraciones que dibuja `OnboardingArt` (cada tarjeta pide una de estas). */
export const ART_SCENES = ['welcome', 'color', 'paints', 'mix', 'plan', 'recipes', 'menu', 'install']

export const TOUR = [
  {
    id: 'welcome',
    art: 'welcome',
    title: '¡Hola! Esto es Color Machine',
    body: [
      'Creá cualquier color mezclando tus pinturas reales.',
      'Te mostramos cómo se usa en un minuto. Podés omitirlo cuando quieras y volver a verlo desde el botón ?.',
    ],
  },
  {
    id: 'color',
    art: 'color',
    title: 'Elegí tu color',
    body: [
      'Movés el punto de la rueda y la barra de claridad. O tocás Foto para sacar el color de una imagen.',
      'En la foto podés tocar un punto o marcar un recorte, y acercar con dos dedos, doble toque o los botones − y +.',
    ],
  },
  {
    id: 'paints',
    art: 'paints',
    title: 'Tus pinturas',
    body: [
      'Agregalas con una foto o con su color, y quedan guardadas en tu cuenta.',
      'El consejo te dice cuáles conviene tener ("la tenés" o "Agregar"). Elegí de 2 a 6 para mezclar.',
    ],
  },
  {
    id: 'mix',
    art: 'mix',
    title: 'Tu mezcla',
    body: [
      'La app calcula cuántas partes de cada pintura mezclar. 1 parte es la medida que quieras: una cucharada, una tapita.',
      'Elegí qué tan exacta: Simple, Normal o Preciso. Y mirá la receta Recomendada (la más simple) o la Más exacta. El botón ⓘ explica cómo leerla.',
    ],
  },
  {
    id: 'plan',
    art: 'plan',
    title: 'Para acercarte más',
    body: [
      'Si la mezcla podría estar más cerca, aparece "Para acercarte más" debajo de los frascos: te dice hacia dónde tira, qué colores faltan ("te falta: Negro") y cómo quedaría. Con Agregar los sumás de una.',
      'Y con Ajustar la hacés más clara u oscura, o más intensa o apagada.',
    ],
  },
  {
    id: 'recipes',
    art: 'recipes',
    title: 'Guardá y mejorá tus recetas',
    body: [
      'Guardá la receta con un nombre y la encontrás en Recetas.',
      'Con Editar mezcla subís o bajás partes, sumás blanco, negro o cualquier color, y guardás los cambios o una copia. "Mezclar este color otra vez" arranca de nuevo.',
    ],
  },
  {
    id: 'menu',
    art: 'menu',
    title: 'El menú y Mis pinturas',
    body: [
      'El botón ☰ de arriba (o deslizar desde el borde izquierdo) abre el menú: Mis pinturas, Recetas, Cuenta y Ayuda.',
      'El botón Crear del centro empieza una mezcla nueva. Tu mezcla en curso no se pierde si cambiás de pestaña.',
    ],
  },
  {
    id: 'install',
    art: 'install',
    title: 'Instalala en tu teléfono',
    body: [], // el texto depende del teléfono: ver `installHint.js`
  },
]

/** Ayuda de cada pantalla: aparece primero al tocar el ?, con la opción de ver el recorrido completo. */
export const CONTEXT = {
  'create-1': {
    art: 'color',
    title: 'Elegí tu color',
    body: [
      'Movés el punto de la rueda y la barra de claridad, o tocás Foto para sacar el color de una imagen.',
      'En la foto, tocá un punto o marcá un recorte. Acercás con dos dedos, doble toque o los botones − y +.',
    ],
  },
  'create-2': {
    art: 'paints',
    title: 'Tus pinturas',
    body: [
      'Elegí de 2 a 6 pinturas para mezclar. Si te falta alguna, tocá Agregar pintura.',
      'El consejo de arriba te dice qué pinturas conviene tener para este color.',
    ],
  },
  'create-3': {
    art: 'plan',
    title: 'Tu mezcla',
    body: [
      'Son las partes de cada pintura. Cambiá la precisión (Simple, Normal, Preciso) y mirá la receta Recomendada o la Más exacta.',
      'Si podría estar más cerca, "Para acercarte más" te dice qué agregar (por ejemplo negro para un marrón oscuro, o blanco para uno claro) o qué cambiar. Con Ajustar la hacés más clara u oscura, o más intensa o apagada.',
    ],
  },
  library: {
    art: 'recipes',
    title: 'Tus recetas',
    body: ['Acá están las recetas que guardaste. Tocá una para ver sus partes, editarla o mezclar ese color otra vez.'],
  },
  recipe: {
    art: 'recipes',
    title: 'Una receta guardada',
    body: [
      'Editar mezcla te deja cambiar las partes y sumar colores. Renombrar y Borrar están abajo.',
      '"Mezclar este color otra vez" arranca una mezcla nueva con este color.',
    ],
  },
  'recipe-edit': {
    art: 'recipes',
    title: 'Editar la mezcla',
    body: [
      'Con − y + cambiás las partes de cada pintura. Más claro suma 1 parte de blanco; Más oscuro, 1 de negro.',
      'Sumar otro color agrega cualquier pintura. Podés deshacer o restablecer, y guardar los cambios o una copia.',
    ],
  },
  paints: {
    art: 'paints',
    title: 'Mis pinturas',
    body: ['Tus pinturas guardadas. Agregá nuevas con una foto o con su color, editalas o borralas.', 'Las elegís para mezclar en el paso 2 de Crear.'],
  },
  account: {
    art: 'menu',
    title: 'Tu cuenta',
    body: ['Acá ves con qué email entraste y podés cerrar sesión.', 'También podés volver a ver el recorrido de bienvenida.'],
  },
}

/** Qué ayuda corresponde a la pantalla actual: `route` (de `useRoute`) y `step` (paso de Crear, 1 a 3). */
export function helpScreenFor(route, step = 1) {
  switch (route?.name) {
    case 'library': return 'library'
    case 'recipe': return 'recipe'
    case 'recipe-edit': return 'recipe-edit'
    case 'paints': return 'paints'
    case 'account': return 'account'
    default: return `create-${[1, 2, 3].includes(step) ? step : 1}`
  }
}
