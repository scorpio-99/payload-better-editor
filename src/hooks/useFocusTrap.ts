'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

const isVisible = (el: HTMLElement): boolean => {
  if (el.hidden) return false
  const rects = el.getClientRects()
  return rects.length > 0
}

const getFocusable = (root: HTMLElement): HTMLElement[] => {
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const out: HTMLElement[] = []
  for (const n of nodes) if (isVisible(n)) out.push(n)
  return out
}

export const useFocusTrap = (
  ref: RefObject<HTMLElement | null>,
  active: boolean = true,
): void => {
  useEffect(() => {
    if (!active) return
    const root = ref.current
    if (!root) return

    const previouslyFocused = (document.activeElement as HTMLElement | null) ?? null

    // Initial focus: prefer first interactive child; fall back to root itself
    // so keyboard users land inside the dialog.
    const focusables = getFocusable(root)
    if (focusables.length > 0) {
      focusables[0].focus()
    } else {
      if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1')
      root.focus()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = getFocusable(root)
      if (items.length === 0) {
        e.preventDefault()
        root.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement as HTMLElement | null
      // If focus has escaped the trap entirely, pull it back to a safe edge.
      if (!activeEl || !root.contains(activeEl)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
        return
      }
      if (e.shiftKey && activeEl === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      // Best-effort restore — the original element may have been removed
      // from the DOM while the overlay was open.
      if (previouslyFocused && previouslyFocused.isConnected) {
        try {
          previouslyFocused.focus()
        } catch {
          /* element no longer focusable */
        }
      }
    }
  }, [ref, active])
}
