'use client'

import { useEffect, useRef, useState } from 'react'
import type { Viewport } from '../admin/ViewportToggle.js'
import type { BetterEditorSettings } from '../state/useBetterEditorSettings.js'
import { clampViewport } from '../internal/limits.js'
import { DEFAULT_RESPONSIVE_WIDTH } from '../internal/constants.js'
import { useBetterEditorConfig } from '../providers/BetterEditorConfigProvider.js'
import { readNumber, writeString } from '../internal/storage.js'

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
