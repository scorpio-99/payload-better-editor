'use client'

import { useEffect, useState } from 'react'

/**
 * Locates Payload's `__main-wrapper` element on the current document /
 * global edit page and returns it as a portal mount node when `enabled`.
 * While mounted, applies scroll-lock + viewport-height clamp so the
 * overlay stays within the wrapper instead of stretching the admin page.
 *
 * Returns null until the wrapper is found (or while disabled). All
 * styles are restored on cleanup.
 */
export const useMainWrapperPortal = (enabled: boolean): HTMLElement | null => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof document === 'undefined') return

    const main =
      document.querySelector<HTMLElement>(
        'main[class*="collection-edit"] [class*="__main-wrapper"]',
      ) ||
      document.querySelector<HTMLElement>(
        'main[class*="global-edit"] [class*="__main-wrapper"]',
      )

    if (!main) return

    const html = document.documentElement
    const body = document.body

    const prevPosition = main.style.position
    const prevOverflow = main.style.overflow
    const prevHeight = main.style.height
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    if (!main.style.position) main.style.position = 'relative'
    main.style.overflow = 'hidden'

    // Lock the outer page scroll so wheel events that escape the iframe
    // or sidebar can't scroll the admin shell along with them.
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    // Clamp the wrapper's height to the viewport from its current top.
    // Without this, the wrapper grows with the underlying form (often
    // thousands of pixels), the absolutely-positioned overlay inherits
    // that height, and neither the iframe nor the sidebar ever overflow
    // their own boxes — instead the page scrolls everything together.
    const updateHeight = () => {
      const top = main.getBoundingClientRect().top
      main.style.height = `${Math.max(0, window.innerHeight - top)}px`
    }
    updateHeight()

    window.addEventListener('resize', updateHeight)

    setMountNode(main)

    return () => {
      window.removeEventListener('resize', updateHeight)
      main.style.position = prevPosition
      main.style.overflow = prevOverflow
      main.style.height = prevHeight
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      setMountNode(null)
    }
  }, [enabled])

  return mountNode
}
