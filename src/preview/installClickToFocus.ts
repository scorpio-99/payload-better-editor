/**
 * Capture-phase click listener: walks up to the nearest
 * `[data-better-editor-id]` and calls `onFocus(id)`. Swallows the click
 * so consumer-side links/buttons don't fire while the editor is open.
 * Returns a teardown.
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
