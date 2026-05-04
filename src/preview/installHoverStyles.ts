import { HOVER_CSS, HOVER_STYLE_ID, clearHoverVars, setHoverVars, type HoverVars } from './hover-css'

export const installHoverStyles = (doc: Document, vars: HoverVars): (() => void) => {
  doc.getElementById(HOVER_STYLE_ID)?.remove()
  const style = doc.createElement('style')
  style.id = HOVER_STYLE_ID
  style.textContent = HOVER_CSS
  doc.head.appendChild(style)
  setHoverVars(doc, vars)
  return () => {
    style.remove()
    clearHoverVars(doc)
  }
}
