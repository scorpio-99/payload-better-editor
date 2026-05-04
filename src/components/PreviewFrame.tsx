'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDocumentEvents, useDocumentInfo } from '@payloadcms/ui'

import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import { HoverToolbarController } from '../preview/HoverToolbarController'
import { TOOLBAR_ID, setHoverVars } from '../preview/hover-css'
import { installClickToFocus } from '../preview/installClickToFocus'
import { installHoverStyles } from '../preview/installHoverStyles'
import { ACTIVE_CLASS, clampViewport } from '../internal/constants'
import { postToParent } from '../internal/postmessage'

export type PreviewFrameProps = {
  previewURL: string | undefined
  isPreviewEnabled: boolean | undefined
  hoverColorTopLevel: string
  hoverColorNested: string
  hoverOutlineWidth: number
  showHoverToolbar: boolean
  hoverToolbarPosition: HoverToolbarPosition
  /** Pixel width of the iframe; `null`/`undefined` = full container width. */
  viewportWidth?: number | null
  /** Render drag handles for live width resize (responsive mode). */
  resizable?: boolean
  onResize?: (next: number) => void
  onIframeWidthChange?: (width: number) => void
}

type BlockAction = 'move-up' | 'move-down' | 'duplicate' | 'add' | 'delete'

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  previewURL,
  isPreviewEnabled,
  hoverColorTopLevel,
  hoverColorNested,
  hoverOutlineWidth,
  showHoverToolbar,
  hoverToolbarPosition,
  viewportWidth,
  resizable = false,
  onResize,
  onIframeWidthChange,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)
  const controllerRef = useRef<HoverToolbarController | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
  }, [previewURL])

  // Latest settings in a ref so the load-listener effect doesn't re-bind
  // on every color tweak; the settings effect below calls update() instead.
  const settingsRef = useRef({
    hoverColorTopLevel,
    hoverColorNested,
    hoverOutlineWidth,
    showHoverToolbar,
    hoverToolbarPosition,
  })
  settingsRef.current = {
    hoverColorTopLevel,
    hoverColorNested,
    hoverOutlineWidth,
    showHoverToolbar,
    hoverToolbarPosition,
  }

  const dispatchBlockAction = useCallback((blockId: string, action: BlockAction) => {
    postToParent({ type: 'block-action', id: blockId, action })
  }, [])

  // Idempotent: tears down previous bindings before installing new ones.
  const bindToDocument = (doc: Document) => {
    teardownRef.current?.()
    controllerRef.current?.destroy()
    controllerRef.current = null

    const s = settingsRef.current

    const removeStyles = installHoverStyles(doc, {
      topColor: s.hoverColorTopLevel,
      nestedColor: s.hoverColorNested,
      outlineWidth: s.hoverOutlineWidth,
    })

    const removeClick = installClickToFocus(doc, (blockId) => {
      postToParent({ type: 'focus-block', id: blockId })
    })

    if (s.showHoverToolbar) {
      controllerRef.current = new HoverToolbarController(doc, {
        position: s.hoverToolbarPosition,
        onAction: dispatchBlockAction,
      })
    } else {
      // Clean up any toolbar left over from a previous setup that had
      // showHoverToolbar=true (e.g. user toggled it off mid-session).
      const existingToolbar = doc.getElementById(TOOLBAR_ID)
      if (existingToolbar) existingToolbar.remove()
      doc
        .querySelectorAll(`.${ACTIVE_CLASS}`)
        .forEach((el) => el.classList.remove(ACTIVE_CLASS))
    }

    teardownRef.current = () => {
      removeStyles()
      removeClick()
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      setIsLoading(false)
      let doc: Document | null = null
      try {
        doc = iframe.contentDocument
      } catch {
        // Cross-origin: fall back to view-only.
        return
      }
      if (!doc) return
      bindToDocument(doc)
    }

    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      onLoad()
    }
    iframe.addEventListener('load', onLoad)

    return () => {
      iframe.removeEventListener('load', onLoad)
      teardownRef.current?.()
      teardownRef.current = null
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
    // Intentionally empty deps: bindings are reapplied via the settings
    // effect below (controller.update + style re-injection), not by
    // re-running this whole effect.
  }, [])

  // Apply setting changes without recreating the controller (preserves
  // its DOM node + current selection).
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    let doc: Document | null = null
    try {
      doc = iframe.contentDocument
    } catch {
      // Cross-origin: fall back to view-only.
      return
    }
    if (!doc) return

    setHoverVars(doc, {
      topColor: hoverColorTopLevel,
      nestedColor: hoverColorNested,
      outlineWidth: hoverOutlineWidth,
    })

    if (showHoverToolbar) {
      if (controllerRef.current) {
        controllerRef.current.update({
          position: hoverToolbarPosition,
          onAction: dispatchBlockAction,
        })
      } else {
        controllerRef.current = new HoverToolbarController(doc, {
          position: hoverToolbarPosition,
          onAction: dispatchBlockAction,
        })
      }
    } else if (controllerRef.current) {
      controllerRef.current.destroy()
      controllerRef.current = null
    }
  }, [
    hoverColorTopLevel,
    hoverColorNested,
    hoverOutlineWidth,
    showHoverToolbar,
    hoverToolbarPosition,
    dispatchBlockAction,
  ])

  const { mostRecentUpdate } = useDocumentEvents()
  const { id } = useDocumentInfo()
  const previewOrigin = useMemo(() => {
    if (!previewURL) return null
    try {
      return new URL(previewURL, window.location.origin).origin
    } catch {
      return null
    }
  }, [previewURL])
  useEffect(() => {
    if (!mostRecentUpdate || !previewOrigin) return
    if (id != null && mostRecentUpdate.id !== id) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'payload-document-event' },
      previewOrigin,
    )
  }, [mostRecentUpdate, id, previewOrigin])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !onIframeWidthChange || typeof ResizeObserver === 'undefined') return
    onIframeWidthChange(iframe.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (typeof w === 'number') onIframeWidthChange(Math.round(w))
    })
    ro.observe(iframe)
    return () => ro.disconnect()
  }, [onIframeWidthChange])

  const onHandleMouseDown = useCallback(
    (side: 'left' | 'right') => (e: React.MouseEvent) => {
      if (!resizable || !onResize || !viewportWidth) return
      e.preventDefault()
      const startX = e.clientX
      const startWidth = viewportWidth
      // Iframe is centered, so dragging either edge by N px symmetrically
      // grows the width by 2N. Right handle: positive delta increases width.
      const dir = side === 'right' ? 2 : -2
      setIsResizing(true)
      const onMove = (ev: MouseEvent) => {
        const delta = (ev.clientX - startX) * dir
        onResize(clampViewport(startWidth + delta))
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsResizing(false)
      }
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [resizable, onResize, viewportWidth],
  )

  if (!isPreviewEnabled) {
    return (
      <div className="better-editor-frame__empty">
        <div>
          <strong>Live preview is not configured for this collection.</strong>
          <p>
            Add an <code>admin.livePreview.url</code> to the collection config so
            the Better Editor can render the draft page here.
          </p>
        </div>
      </div>
    )
  }

  if (!previewURL) {
    return (
      <div className="better-editor-frame__empty">
        <div>Loading preview URL…</div>
      </div>
    )
  }

  const constrained = typeof viewportWidth === 'number' && viewportWidth > 0

  // Always render iframe inside the same wrapper div so React doesn't
  // remount it when toggling between constrained/full-width — that
  // would reload the page AND drop our ResizeObserver registration.
  return (
    <div
      className={
        'better-editor-frame__viewport' +
        (constrained ? ' better-editor-frame__viewport--constrained' : '') +
        (resizable ? ' better-editor-frame__viewport--resizable' : '') +
        (isResizing ? ' better-editor-frame__viewport--resizing' : '')
      }
    >
      {resizable ? (
        <div
          className="better-editor-frame__handle better-editor-frame__handle--left"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize preview from left"
          onMouseDown={onHandleMouseDown('left')}
        />
      ) : null}
      <iframe
        ref={iframeRef}
        className="better-editor-frame"
        src={previewURL}
        title="Better Editor preview"
        style={
          constrained
            ? { width: `${viewportWidth}px`, maxWidth: '100%' }
            : undefined
        }
      />
      {isLoading ? (
        <div
          className="better-editor-frame__skeleton"
          role="status"
          aria-label="Loading preview"
        >
          <div className="better-editor-frame__skeleton-bar better-editor-frame__skeleton-bar--lg" />
          <div className="better-editor-frame__skeleton-bar" />
          <div className="better-editor-frame__skeleton-bar better-editor-frame__skeleton-bar--sm" />
          <div className="better-editor-frame__skeleton-block" />
        </div>
      ) : null}
      {resizable ? (
        <div
          className="better-editor-frame__handle better-editor-frame__handle--right"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize preview from right"
          onMouseDown={onHandleMouseDown('right')}
        />
      ) : null}
    </div>
  )
}
