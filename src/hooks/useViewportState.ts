'use client'

import { useEffect, useRef, useState } from 'react'
import type { Viewport } from '../components/ViewportToggle'
import type { BetterEditorSettings } from '../useBetterEditorSettings'
import { STORAGE_RESPONSIVE_WIDTH, clampViewport } from '../internal/constants'
import { readNumber, writeString } from '../internal/storage'

const DEFAULT_RESPONSIVE_WIDTH = 1024

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
    case 'fullscreen':
      return null
  }
}

export const useViewportState = (settings: BetterEditorSettings): UseViewportStateReturn => {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [responsiveWidth, setResponsiveWidth] = useState<number>(() =>
    readNumber(STORAGE_RESPONSIVE_WIDTH, DEFAULT_RESPONSIVE_WIDTH, clampViewport),
  )
  const [iframeWidth, setIframeWidth] = useState<number | null>(null)

  const skipFirstWrite = useRef(true)
  useEffect(() => {
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false
      return
    }
    writeString(STORAGE_RESPONSIVE_WIDTH, String(responsiveWidth))
  }, [responsiveWidth])

  return {
    viewport,
    setViewport,
    responsiveWidth,
    setResponsiveWidth,
    iframeWidth,
    setIframeWidth,
    viewportWidth: resolveWidth(viewport, settings, responsiveWidth),
    isFullscreen: viewport === 'fullscreen',
  }
}
