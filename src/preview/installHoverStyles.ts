import { HOVER_CSS, HOVER_STYLE_ID, setHoverVars, type HoverVars } from './hover-css'

export const installHoverStyles = (doc: Document, vars: HoverVars): (() => void) => {
  const existing = doc.getElementById(HOVER_STYLE_ID)
  if (existing) existing.remove()
  const style = doc.createElement('style')
  style.id = HOVER_STYLE_ID
  style.textContent = HOVER_CSS
  doc.head.appendChild(style)
  setHoverVars(doc, vars)
  return () => {
    if (style.parentNode) style.parentNode.removeChild(style)
    const root = doc.documentElement
    root.style.removeProperty('--bee-top')
    root.style.removeProperty('--bee-nested')
    root.style.removeProperty('--bee-outline-width')
  }
}
