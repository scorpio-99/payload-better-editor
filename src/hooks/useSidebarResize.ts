'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from '../useBetterEditorSettings'

const SIDEBAR_WIDTH_KEY = 'better-editor:sidebar-width'

function readPersistedWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_KEY)
    const parsed = raw == null ? NaN : Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_SIDEBAR_WIDTH
    return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed))
  } catch {
    return DEFAULT_SIDEBAR_WIDTH
  }
}

export type UseSidebarResizeReturn = {
  sidebarWidth: number
  isResizing: boolean
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void
}

/** Drag-to-resize the sidebar; persisted in localStorage. */
export const useSidebarResize = (
  sidebarPosition: 'left' | 'right',
): UseSidebarResizeReturn => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => readPersistedWidth())
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
    } catch {
      // storage unavailable / quota exceeded
    }
  }, [sidebarWidth])

  // Left/right position inverts the drag direction so both feel natural.
  const onResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth
      const direction = sidebarPosition === 'right' ? -1 : 1

      setIsResizing(true)

      const onMove = (ev: MouseEvent) => {
        const delta = (ev.clientX - startX) * direction
        const next = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta),
        )
        setSidebarWidth(next)
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsResizing(false)
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [sidebarWidth, sidebarPosition],
  )

  return { sidebarWidth, isResizing, onResizeStart }
}
