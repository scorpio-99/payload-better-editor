export type CoalescedDragHandlers = {
  /** Runs at most once per animation frame with the latest pointer clientX. */
  onUpdate: (clientX: number) => void
  /** Runs once when the drag ends or is torn down, after the final flush. */
  onEnd?: () => void
}

/**
 * Horizontal pointer drag: window mousemove/mouseup listeners that coalesce
 * moves into one onUpdate per frame and flush the final position on release.
 * Sets the body cursor + disables text selection. Returns a function to end it.
 */
export const startHorizontalDrag = (
  cursor: string,
  { onUpdate, onEnd }: CoalescedDragHandlers,
): (() => void) => {
  let rafId = 0
  let pendingX = 0
  let hasPending = false

  const flush = (): void => {
    if (!hasPending) return
    hasPending = false
    onUpdate(pendingX)
  }

  const onMove = (e: MouseEvent): void => {
    pendingX = e.clientX
    hasPending = true
    if (!rafId) {
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        flush()
      })
    }
  }

  let ended = false
  const end = (): void => {
    if (ended) return
    ended = true
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', end)
    if (rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }
    flush()
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    onEnd?.()
  }

  document.body.style.cursor = cursor
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', end)

  return end
}
