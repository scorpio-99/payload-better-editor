'use client'

import { useEffect, useState } from 'react'

/**
 * Returns Payload's `__main-wrapper` as a portal mount node when
 * `enabled`. Applies scroll-lock + viewport-height clamp on the wrapper;
 * cleanup restores everything.
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

    // Lock outer page scroll — wheel events from iframe/sidebar would
    // otherwise scroll the admin shell along with them.
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
