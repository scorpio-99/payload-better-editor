import { BLOCK_ID_ATTR, BLOCK_ID_SELECTOR } from '../internal/constants'

export const installClickToFocus = (
  doc: Document,
  onFocus: (id: string) => void,
): (() => void) => {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const idEl = target.closest<HTMLElement>(BLOCK_ID_SELECTOR)
    if (!idEl) return
    const id = idEl.getAttribute(BLOCK_ID_ATTR)
    if (!id) return
    // Swallow the click so consumer-side links/buttons don't fire while the editor is open.
    e.preventDefault()
    e.stopPropagation()
    onFocus(id)
  }
  doc.addEventListener('click', onClick, true)
  return () => {
    doc.removeEventListener('click', onClick, true)
  }
}
