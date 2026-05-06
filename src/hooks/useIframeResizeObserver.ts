'use client'

import { useEffect, type RefObject } from 'react'

export const useIframeResizeObserver = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  onIframeWidthChange?: (width: number) => void,
): void => {
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !onIframeWidthChange || typeof ResizeObserver === 'undefined') return
    onIframeWidthChange(iframe.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (typeof w === 'number') onIframeWidthChange(Math.round(w))
    })
    ro.observe(iframe)
    return () => ro.disconnect()
  }, [iframeRef, onIframeWidthChange])
}
