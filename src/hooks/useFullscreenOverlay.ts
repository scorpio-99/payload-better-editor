'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Drives the browser Fullscreen API for the overlay root. `onExitFullscreen`
 * fires when the user exits via Esc / browser UI so callers can sync their
 * viewport state.
 */
export const useFullscreenOverlay = (
  isFullscreen: boolean,
  onExitFullscreen: () => void,
): React.RefObject<HTMLDivElement | null> => {
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = overlayRef.current
    if (!root) return
    if (isFullscreen && !document.fullscreenElement) {
      // Some browsers block requestFullscreen outside a user gesture.
      root.requestFullscreen?.().catch(() => {})
    } else if (!isFullscreen && document.fullscreenElement === root) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [isFullscreen])

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        onExitFullscreen()
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [isFullscreen, onExitFullscreen])

  return overlayRef
}
