export const SWIPE_MIN_DX = 48 // px que hay que recorrer en horizontal
export const SWIPE_MAX_SLOPE = 0.6 // |dy| / |dx| máximo: tiene que ser un gesto bastante horizontal

/** ¿Un gesto de (dx, dy) cuenta como "deslizar hacia la derecha"? */
export function isRightSwipe(dx, dy) {
  return dx >= SWIPE_MIN_DX && Math.abs(dy) <= dx * SWIPE_MAX_SLOPE
}

/** Dirección de un deslizamiento horizontal: 'right', 'left' o `null` si es corto o muy en diagonal. */
export function swipeDirection(dx, dy) {
  if (isRightSwipe(dx, dy)) return 'right'
  if (isRightSwipe(-dx, dy)) return 'left'
  return null
}
