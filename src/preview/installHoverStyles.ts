import { HOVER_STYLE_ID, TOOLBAR_CSS, makeIdHoverCss } from './hover-css'

/**
 * Injects a single `<style id={HOVER_STYLE_ID}>` element into the iframe's
 * document containing the hover outline rules + toolbar CSS. Replaces any
 * existing element with the same id (re-running the function is safe).
 *
 * Returns a teardown that removes the style element.
 */
export const installHoverStyles = (
  doc: Document,
  opts: { topColor: string; nestedColor: string; outlineWidth: number },
): (() => void) => {
  const existing = doc.getElementById(HOVER_STYLE_ID)
  if (existing) existing.remove()
  const style = doc.createElement('style')
  style.id = HOVER_STYLE_ID
  style.textContent =
    makeIdHoverCss(opts.topColor, opts.nestedColor, opts.outlineWidth) + TOOLBAR_CSS
  doc.head.appendChild(style)
  return () => {
    if (style.parentNode) style.parentNode.removeChild(style)
  }
}
