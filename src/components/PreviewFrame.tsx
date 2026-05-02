'use client'

import React, { useEffect, useRef, useState } from 'react'

import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import { HoverToolbarController } from '../preview/HoverToolbarController'
import { TOOLBAR_ID, setHoverVars } from '../preview/hover-css'
import { installClickToFocus } from '../preview/installClickToFocus'
import { installHoverStyles } from '../preview/installHoverStyles'

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

/**
 * Renders the frontend draft URL in an iframe and wires up the in-iframe
 * hover styles + click-to-focus + hover toolbar, plus save-refresh
 * forwarding. Same-origin only — if `contentDocument` is inaccessible,
 * the iframe falls back to view-only.
 */
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
  // Combined teardown for all bindings on the current iframe document.
  // Replaced on every iframe `load`.
  const teardownRef = useRef<(() => void) | null>(null)
  const controllerRef = useRef<HoverToolbarController | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Reset the loading flag when the iframe src changes (navigation /
  // viewport switch), so the skeleton reappears until the new doc loads.
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
      window.parent.postMessage(
        { type: 'focus-block', id: blockId },
        window.location.origin,
      )
    })

    if (s.showHoverToolbar) {
      controllerRef.current = new HoverToolbarController(doc, {
        position: s.hoverToolbarPosition,
        onAction: (blockId, action) => {
          window.parent.postMessage(
            { type: 'block-action', id: blockId, action },
            window.location.origin,
          )
        },
      })
    } else {
      // Clean up any toolbar left over from a previous setup that had
      // showHoverToolbar=true (e.g. user toggled it off mid-session).
      const existingToolbar = doc.getElementById(TOOLBAR_ID)
      if (existingToolbar) existingToolbar.remove()
      doc
        .querySelectorAll('.better-editor-active')
        .forEach((el) => el.classList.remove('better-editor-active'))
    }

    teardownRef.current = () => {
      removeStyles()
      removeClick()
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }

  // Bind on iframe `load`; the effect cleanup tears down on unmount.
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

    // Bind immediately if the iframe already finished loading.
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
      return
    }
    if (!doc) return

    // Color/outline updates are just CSS variable writes — the static
    // CSS picks them up. No re-injection needed.
    setHoverVars(doc, {
      topColor: hoverColorTopLevel,
      nestedColor: hoverColorNested,
      outlineWidth: hoverOutlineWidth,
    })

    if (showHoverToolbar) {
      if (controllerRef.current) {
        controllerRef.current.update({
          position: hoverToolbarPosition,
          onAction: (blockId, action) => {
            window.parent.postMessage(
              { type: 'block-action', id: blockId, action },
              window.location.origin,
            )
          },
        })
      } else {
        controllerRef.current = new HoverToolbarController(doc, {
          position: hoverToolbarPosition,
          onAction: (blockId, action) => {
            window.parent.postMessage(
              { type: 'block-action', id: blockId, action },
              window.location.origin,
            )
          },
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
  ])

  // Track the iframe's actual rendered width and report it up so the
  // preview toolbar can display it.
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

  const onHandleMouseDown = (side: 'left' | 'right') => (e: React.MouseEvent) => {
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
      onResize(Math.max(240, Math.min(2400, startWidth + delta)))
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
  }

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
