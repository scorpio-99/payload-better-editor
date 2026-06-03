'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  SIDEBAR_KEYBOARD_STEP_PX,
  SIDEBAR_KEYBOARD_STEP_LARGE_PX,
  STORAGE_DEBOUNCE_MS,
} from '../internal/constants'
import { useBetterEditorConfig } from '../providers/BetterEditorConfigProvider'
import { readNumber, writeString } from '../internal/storage'
import { startHorizontalDrag } from '../internal/drag'

const clampSidebar = (n: number): number =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, n))

export type UseSidebarResizeReturn = {
  sidebarWidth: number
  isResizing: boolean
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void
  onResizeKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
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
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce storage writes — drag fires 60×/s while keyboard nudges fire
  // per keystroke. Either way we only want the final value persisted.
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true
      return
    }
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      writeString(storageKeys.sidebarWidth, String(sidebarWidth))
      writeTimerRef.current = null
    }, STORAGE_DEBOUNCE_MS)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [sidebarWidth, storageKeys.sidebarWidth])

  // Release listeners + body styles + flush pending storage write on unmount.
  useEffect(
    () => () => {
      dragCleanupRef.current?.()
      if (writeTimerRef.current) {
        clearTimeout(writeTimerRef.current)
        writeString(storageKeys.sidebarWidth, String(widthRef.current))
      }
    },
    [storageKeys.sidebarWidth],
  )

  const onResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = widthRef.current
    const direction = positionRef.current === 'right' ? -1 : 1
    setIsResizing(true)
    dragCleanupRef.current = startHorizontalDrag('col-resize', {
      onUpdate: (clientX) => setSidebarWidth(clampSidebar(startWidth + (clientX - startX) * direction)),
      onEnd: () => {
        setIsResizing(false)
        dragCleanupRef.current = null
      },
    })
  }, [])

  // Arrow keys nudge the handle for keyboard users (WCAG 2.1 separator
  // semantics). Direction matches the mouse drag — Right when the sidebar
  // sits on the right grows the sidebar inward.
  const onResizeKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const direction = positionRef.current === 'right' ? -1 : 1
    let delta = 0
    if (e.key === 'ArrowLeft') delta = -SIDEBAR_KEYBOARD_STEP_PX * direction
    else if (e.key === 'ArrowRight') delta = SIDEBAR_KEYBOARD_STEP_PX * direction
    else if (e.key === 'PageUp') delta = -SIDEBAR_KEYBOARD_STEP_LARGE_PX * direction
    else if (e.key === 'PageDown') delta = SIDEBAR_KEYBOARD_STEP_LARGE_PX * direction
    else if (e.key === 'Home') {
      e.preventDefault()
      setSidebarWidth(MIN_SIDEBAR_WIDTH)
      return
    } else if (e.key === 'End') {
      e.preventDefault()
      setSidebarWidth(MAX_SIDEBAR_WIDTH)
      return
    }
    if (delta === 0) return
    e.preventDefault()
    setSidebarWidth((w) => clampSidebar(w + delta))
  }, [])

  return { sidebarWidth, isResizing, onResizeStart, onResizeKeyDown }
}
