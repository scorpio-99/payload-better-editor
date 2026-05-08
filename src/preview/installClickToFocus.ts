import { BLOCK_ID_ATTR, BLOCK_ID_SELECTOR } from '../internal/dom'

export type InstallClickToFocusOptions = {
  /** Returning false from this gate lets the click propagate to the
   * consumer page (interact mode) instead of selecting the block. */
  isEnabled?: () => boolean
}

export const installClickToFocus = (
  doc: Document,
  onFocus: (id: string) => void,
  options: InstallClickToFocusOptions = {},
): (() => void) => {
  const onClick = (e: MouseEvent) => {
    if (options.isEnabled && !options.isEnabled()) return
    // Cross-realm-safe element check — `instanceof` is realm-local.
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
