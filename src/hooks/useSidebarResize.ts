'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from '../state/useBetterEditorSettings'
import { useBetterEditorConfig } from '../providers/BetterEditorConfigProvider'
import { readNumber, writeString } from '../internal/storage'

const clampSidebar = (n: number): number =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, n))

export type UseSidebarResizeReturn = {
  sidebarWidth: number
  isResizing: boolean
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void
}

export const useSidebarResize = (
  sidebarPosition: 'left' | 'right',
): UseSidebarResizeReturn => {
  const { storageKeys } = useBetterEditorConfig()
  const [sidebarWidth, setSidebarWidth] = useState<number>(() =>
    readNumber(storageKeys.sidebarWidth, DEFAULT_SIDEBAR_WIDTH, clampSidebar),
  )
  const [isResizing, setIsResizing] = useState(false)

  const widthRef = useRef(sidebarWidth)
  widthRef.current = sidebarWidth

  const positionRef = useRef(sidebarPosition)
  positionRef.current = sidebarPosition

  const dragCleanupRef = useRef<(() => void) | null>(null)

  // Skip persisting the value we just hydrated from storage.
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true
      return
    }
    writeString(storageKeys.sidebarWidth, String(sidebarWidth))
  }, [sidebarWidth, storageKeys.sidebarWidth])

  // Release listeners + body styles if the consumer unmounts mid-drag.
  useEffect(() => () => dragCleanupRef.current?.(), [])

  const onResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = widthRef.current
    const direction = positionRef.current === 'right' ? -1 : 1

    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      setSidebarWidth(clampSidebar(startWidth + (ev.clientX - startX) * direction))
    }
    const cleanup = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', cleanup)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setIsResizing(false)
      dragCleanupRef.current = null
    }
    dragCleanupRef.current = cleanup
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', cleanup)
  }, [])

  return { sidebarWidth, isResizing, onResizeStart }
}
