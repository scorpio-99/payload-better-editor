/**
 * Adds a capture-phase click listener on the iframe's document. When the
 * user clicks anywhere inside a `[data-better-editor-id]` element, the
 * walk-up finds the nearest block id and invokes `onFocus(id)`. The click
 * is preventDefault'd + stopPropagation'd so consumer-side links/buttons
 * don't fire while the editor is open.
 *
 * Returns a teardown that removes the listener.
 */
export const installClickToFocus = (
  doc: Document,
  onFocus: (id: string) => void,
): (() => void) => {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const idEl = target.closest<HTMLElement>('[data-better-editor-id]')
    if (!idEl) return
    const id = idEl.getAttribute('data-better-editor-id')
    if (!id) return
    e.preventDefault()
    e.stopPropagation()
    onFocus(id)
  }
  doc.addEventListener('click', onClick, true)
  return () => {
    doc.removeEventListener('click', onClick, true)
  }
}
