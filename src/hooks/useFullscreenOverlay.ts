'use client'

import React, { useEffect, useRef } from 'react'

export const useFullscreenOverlay = (
  isFullscreen: boolean,
  onExitFullscreen: () => void,
): React.RefObject<HTMLDivElement | null> => {
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Mutable ref so the fullscreenchange listener can call the latest handler
  // without re-binding when the consumer recreates its callback.
  const onExitRef = useRef(onExitFullscreen)
  onExitRef.current = onExitFullscreen

  useEffect(() => {
    const root = overlayRef.current
    if (!root) return

    if (isFullscreen && !document.fullscreenElement) {
      // Some browsers reject requestFullscreen outside a user gesture.
      root.requestFullscreen?.().catch(() => {})
    } else if (!isFullscreen && document.fullscreenElement === root) {
      document.exitFullscreen?.().catch(() => {})
    }

    if (!isFullscreen) return

    const onFsChange = () => {
      if (!document.fullscreenElement) onExitRef.current()
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [isFullscreen])

  return overlayRef
}
