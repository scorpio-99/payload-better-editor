'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { clampViewport } from '../internal/limits'

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

  // Track in-flight drag so unmount mid-drag can release body styles + listeners.
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
      // Iframe is centered; dragging either edge by N px symmetrically grows
      // the width by 2N. Right handle: positive delta increases width.
      const dir = side === 'right' ? 2 : -2
      setIsResizing(true)
      const onMove = (ev: MouseEvent) => {
        onResize(clampViewport(startWidth + (ev.clientX - startX) * dir))
      }
      const cleanup = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        if (isMountedRef.current) setIsResizing(false)
        dragCleanupRef.current = null
      }
      const onUp = () => cleanup()
      dragCleanupRef.current = cleanup
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [resizable, onResize, viewportWidth],
  )

  return { isResizing, onHandleMouseDown }
}
