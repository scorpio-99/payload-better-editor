import { BLOCK_ID_ATTR, BLOCK_ID_SELECTOR } from '../internal/constants'

export const installClickToFocus = (
  doc: Document,
  onFocus: (id: string) => void,
): (() => void) => {
  const onClick = (e: MouseEvent) => {
    // `instanceof Element` is realm-local; this listener is registered
    // on the iframe doc but the closure runs in the parent realm, so a
    // duck-type via `closest` is the cross-realm-safe gate.
    const target = e.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const idEl = target.closest<HTMLElement>(BLOCK_ID_SELECTOR)
    if (!idEl) return
    const id = idEl.getAttribute(BLOCK_ID_ATTR)
    if (!id) return
    // Swallow so consumer-side links/buttons don't fire while the editor is open.
    e.preventDefault()
    e.stopPropagation()
    onFocus(id)
  }
  doc.addEventListener('click', onClick, true)
  return () => doc.removeEventListener('click', onClick, true)
}
