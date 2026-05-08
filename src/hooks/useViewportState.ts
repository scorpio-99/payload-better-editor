'use client'

import { useEffect, useRef, useState } from 'react'
import type { Viewport } from '../admin/ViewportToggle'
import type { BetterEditorSettings } from '../state/useBetterEditorSettings'
import { clampViewport } from '../internal/limits'
import { DEFAULT_RESPONSIVE_WIDTH } from '../internal/constants'
import { useBetterEditorConfig } from '../providers/BetterEditorConfigProvider'
import { readNumber, writeString } from '../internal/storage'

export type UseViewportStateReturn = {
  viewport: Viewport
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>
  responsiveWidth: number
  setResponsiveWidth: React.Dispatch<React.SetStateAction<number>>
  viewportWidth: number | null
}

const resolveWidth = (
  viewport: Viewport,
  settings: BetterEditorSettings,
  responsiveWidth: number,
): number | null => {
  switch (viewport) {
    case 'tablet':
      return settings.tabletWidth
    case 'mobile':
      return settings.mobileWidth
    case 'responsive':
      return responsiveWidth
    case 'desktop':
      return null
  }
}

export const useViewportState = (settings: BetterEditorSettings): UseViewportStateReturn => {
  const { storageKeys } = useBetterEditorConfig()
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [responsiveWidth, setResponsiveWidth] = useState<number>(() =>
    readNumber(storageKeys.responsiveWidth, DEFAULT_RESPONSIVE_WIDTH, clampViewport),
  )

  // Skip persisting the value we just hydrated from storage.
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true
      return
    }
    writeString(storageKeys.responsiveWidth, String(responsiveWidth))
  }, [responsiveWidth, storageKeys.responsiveWidth])

  return {
    viewport,
    setViewport,
    responsiveWidth,
    setResponsiveWidth,
    viewportWidth: resolveWidth(viewport, settings, responsiveWidth),
  }
}
