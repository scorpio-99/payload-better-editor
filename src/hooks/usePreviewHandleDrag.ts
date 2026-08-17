'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { clampViewport } from '../internal/limits.js'
import { startHorizontalDrag } from '../internal/drag.js'

export type UsePreviewHandleDragOptions = {
  resizable: boolean
  viewportWidth?: number | null
  onResize?: (next: number) => void
}

export type UsePreviewHandleDragReturn = {
  isResizing: boolean
  onHandleMouseDown: (side: 'left' | 'right') => (e: React.MouseEvent) => void
}

export const usePreviewHandleDrag = ({
  resizable,
  viewportWidth,
  onResize,
}: UsePreviewHandleDragOptions): UsePreviewHandleDragReturn => {
  const [isResizing, setIsResizing] = useState(false)

  const dragCleanupRef = useRef<(() => void) | null>(null)
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      dragCleanupRef.current?.()
    }
  }, [])

  const onHandleMouseDown = useCallback(
    (side: 'left' | 'right') => (e: React.MouseEvent) => {
      if (!resizable || !onResize || !viewportWidth) return
      e.preventDefault()
      const startX = e.clientX
      const startWidth = viewportWidth
      // Centered iframe grows by 2px per dragged edge px.
      const dir = side === 'right' ? 2 : -2
      setIsResizing(true)
      dragCleanupRef.current = startHorizontalDrag('ew-resize', {
        onUpdate: (clientX) => onResize(clampViewport(startWidth + (clientX - startX) * dir)),
        onEnd: () => {
          if (isMountedRef.current) setIsResizing(false)
          dragCleanupRef.current = null
        },
      })
    },
    [resizable, onResize, viewportWidth],
  )

  return { isResizing, onHandleMouseDown }
}
