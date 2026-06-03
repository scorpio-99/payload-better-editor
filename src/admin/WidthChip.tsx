'use client'

import React, { useSyncExternalStore, type RefObject } from 'react'

// Live pixel-width readout for the preview iframe.
export const WidthChip: React.FC<{ iframeRef: RefObject<HTMLIFrameElement | null> }> = ({
  iframeRef,
}) => {
  const width = useSyncExternalStore(
    (onChange) => {
      const el = iframeRef.current
      if (!el || typeof ResizeObserver === 'undefined') return () => {}
      const observer = new ResizeObserver(onChange)
      observer.observe(el)
      return () => observer.disconnect()
    },
    () => {
      const w = iframeRef.current?.clientWidth
      return typeof w === 'number' && w > 0 ? Math.round(w) : null
    },
    () => null,
  )

  if (!width) return null
  return (
    <span className="better-editor__width-chip" aria-live="polite">
      {width}
      <span className="better-editor__width-chip-unit">px</span>
    </span>
  )
}
