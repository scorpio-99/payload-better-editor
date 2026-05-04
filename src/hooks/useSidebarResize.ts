'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from '../useBetterEditorSettings'
import { STORAGE_SIDEBAR_WIDTH } from '../internal/constants'
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
  const [sidebarWidth, setSidebarWidth] = useState<number>(() =>
    readNumber(STORAGE_SIDEBAR_WIDTH, DEFAULT_SIDEBAR_WIDTH, clampSidebar),
  )
  const [isResizing, setIsResizing] = useState(false)

  // Skip the no-op write on initial mount (value just came from storage).
  const skipFirstWrite = useRef(true)
  useEffect(() => {
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false
      return
    }
    writeString(STORAGE_SIDEBAR_WIDTH, String(sidebarWidth))
  }, [sidebarWidth])

  const onResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth
      const direction = sidebarPosition === 'right' ? -1 : 1

      setIsResizing(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (ev: MouseEvent) => {
        setSidebarWidth(clampSidebar(startWidth + (ev.clientX - startX) * direction))
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsResizing(false)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [sidebarWidth, sidebarPosition],
  )

  return { sidebarWidth, isResizing, onResizeStart }
}
