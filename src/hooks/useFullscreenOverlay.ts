'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Drives the browser Fullscreen API for the overlay root. When
 * `isFullscreen` becomes true the overlay enters fullscreen; when it
 * becomes false the overlay exits. If the user exits via Esc / browser
 * UI, `onExitFullscreen` is invoked so callers can reset their viewport
 * state and bring the sidebar back.
 *
 * Returns the ref the caller spreads on the overlay root element.
 */
export const useFullscreenOverlay = (
  isFullscreen: boolean,
  onExitFullscreen: () => void,
): React.RefObject<HTMLDivElement | null> => {
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Toggle the browser's Fullscreen API on the overlay root when entering /
  // leaving fullscreen viewport.
  useEffect(() => {
    const root = overlayRef.current
    if (!root) return
    if (isFullscreen && !document.fullscreenElement) {
      root.requestFullscreen?.().catch(() => {
        // Some browsers block requestFullscreen outside user gesture; fail quiet.
      })
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
