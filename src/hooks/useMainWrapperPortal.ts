'use client'

import { useEffect, useState } from 'react'

const DEFAULT_ADMIN_WRAPPER_SELECTOR =
  'main[class*="collection-edit"] [class*="__main-wrapper"], main[class*="global-edit"] [class*="__main-wrapper"]'

// WeakSet so multiple plugin instances on the same origin each get their
// own warning instead of falling silent after the first one fires.
const warnedDocs = new WeakSet<Document>()

const resolveMountNode = (selector: string): HTMLElement | null => {
  if (typeof document === 'undefined') return null
  const target = document.querySelector<HTMLElement>(selector)
  if (target) return target

  if (process.env.NODE_ENV !== 'production' && !warnedDocs.has(document)) {
    warnedDocs.add(document)

    console.warn(
      `[better-editor] No element matched "${selector}" — the Payload admin DOM may have changed. Falling back to <main> / <body>. You can override the selector via BetterEditorConfig.adminPortalSelector.`,
    )
  }

  return document.querySelector<HTMLElement>('main') ?? document.body ?? null
}

export const useMainWrapperPortal = (
  enabled: boolean,
  adminPortalSelector?: string,
): HTMLElement | null => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    const main = resolveMountNode(adminPortalSelector ?? DEFAULT_ADMIN_WRAPPER_SELECTOR)
    if (!main) return

    const html = document.documentElement
    const body = document.body

    const prev = {
      position: main.style.position,
      overflow: main.style.overflow,
      height: main.style.height,
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
    }

    if (!main.style.position) main.style.position = 'relative'
    main.style.overflow = 'hidden'

    // Lock outer page scroll so wheel events from iframe/sidebar don't
    // also scroll the admin shell underneath.
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    // Without this clamp the wrapper grows with the underlying form
    // (~thousands of pixels) and the iframe + sidebar never get their
    // own scroll containers.
    const updateHeight = () => {
      const top = main.getBoundingClientRect().top
      main.style.height = `${Math.max(0, window.innerHeight - top)}px`
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)

    setMountNode(main)

    return () => {
      window.removeEventListener('resize', updateHeight)
      main.style.position = prev.position
      main.style.overflow = prev.overflow
      main.style.height = prev.height
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      setMountNode(null)
    }
  }, [enabled, adminPortalSelector])

  return mountNode
}
