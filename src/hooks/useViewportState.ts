'use client'

import { useEffect, useState } from 'react'
import type { Viewport } from '../components/ViewportToggle'
import type { BetterEditorSettings } from '../useBetterEditorSettings'

const RESPONSIVE_WIDTH_KEY = 'better-editor:responsive-width'
const DEFAULT_RESPONSIVE_WIDTH = 1024

function readPersistedResponsiveWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_RESPONSIVE_WIDTH
  try {
    const raw = window.localStorage.getItem(RESPONSIVE_WIDTH_KEY)
    const parsed = raw == null ? NaN : Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_RESPONSIVE_WIDTH
    return Math.min(2400, Math.max(240, parsed))
  } catch {
    return DEFAULT_RESPONSIVE_WIDTH
  }
}

export type UseViewportStateReturn = {
  viewport: Viewport
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>
  responsiveWidth: number
  setResponsiveWidth: React.Dispatch<React.SetStateAction<number>>
  iframeWidth: number | null
  setIframeWidth: React.Dispatch<React.SetStateAction<number | null>>
  viewportWidth: number | null
  isFullscreen: boolean
}

/**
 * Tracks the current preview viewport (desktop / tablet / mobile / responsive
 * / fullscreen), the responsive-mode draggable width, and the iframe's
 * actual rendered width. Persists the responsive width across opens.
 *
 * `viewportWidth` is the iframe constraint to apply: null for desktop +
 * fullscreen (full available width), settings-driven for tablet/mobile,
 * draggable `responsiveWidth` for responsive mode.
 */
export const useViewportState = (settings: BetterEditorSettings): UseViewportStateReturn => {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [responsiveWidth, setResponsiveWidth] = useState<number>(() =>
    readPersistedResponsiveWidth(),
  )
  const [iframeWidth, setIframeWidth] = useState<number | null>(null)

  // Persist the responsive-mode width across opens (separate from sidebar).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(RESPONSIVE_WIDTH_KEY, String(responsiveWidth))
    } catch {
      // ignore
    }
  }, [responsiveWidth])

  // Resolve the active viewport width from settings + responsive state.
  // Fullscreen + Desktop both render at full available preview width.
  const viewportWidth =
    viewport === 'desktop' || viewport === 'fullscreen'
      ? null
      : viewport === 'tablet'
        ? settings.tabletWidth
        : viewport === 'mobile'
          ? settings.mobileWidth
          : responsiveWidth

  return {
    viewport,
    setViewport,
    responsiveWidth,
    setResponsiveWidth,
    iframeWidth,
    setIframeWidth,
    viewportWidth,
    isFullscreen: viewport === 'fullscreen',
  }
}
