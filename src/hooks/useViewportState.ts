'use client'

import { useEffect, useState } from 'react'
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

export const useViewportState = (settings: BetterEditorSettings): UseViewportStateReturn => {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [responsiveWidth, setResponsiveWidth] = useState<number>(() =>
    readNumber(STORAGE_RESPONSIVE_WIDTH, DEFAULT_RESPONSIVE_WIDTH, clampViewport),
  )
  const [iframeWidth, setIframeWidth] = useState<number | null>(null)

  useEffect(() => {
    writeString(STORAGE_RESPONSIVE_WIDTH, String(responsiveWidth))
  }, [responsiveWidth])

  const widthByViewport: Record<Viewport, number | null> = {
    desktop: null,
    fullscreen: null,
    tablet: settings.tabletWidth,
    mobile: settings.mobileWidth,
    responsive: responsiveWidth,
  }
  const viewportWidth = widthByViewport[viewport]

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
