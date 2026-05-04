'use client'

import { useEffect, useState } from 'react'

const MAIN_WRAPPER_SELECTOR =
  'main[class*="collection-edit"] [class*="__main-wrapper"], main[class*="global-edit"] [class*="__main-wrapper"]'

export const useMainWrapperPortal = (enabled: boolean): HTMLElement | null => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    const main = document.querySelector<HTMLElement>(MAIN_WRAPPER_SELECTOR)
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
  }, [enabled])

  return mountNode
}
