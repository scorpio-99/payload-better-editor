'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAllFormFields, useDocumentEvents, useDocumentInfo } from '@payloadcms/ui'

import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import { HoverToolbarController, type HoverToolbarOptions } from '../preview/HoverToolbarController'
import { INTERACT_BODY_ATTR, TOOLBAR_ID, setHoverVars } from '../preview/hover-css'
import { installClickToFocus } from '../preview/installClickToFocus'
import { installHoverStyles } from '../preview/installHoverStyles'
import type { BlockActionMessage } from '../preview/protocol'
import { ACTIVE_CLASS, ACTIVE_SELECTOR, clampViewport } from '../internal/constants'
import { postToParent } from '../internal/postmessage'
import { useEditorHistory } from '../useEditorHistory'

export type PreviewFrameProps = {
  previewURL: string | undefined
  isPreviewEnabled: boolean | undefined
  hoverColorTopLevel: string
  hoverColorNested: string
  hoverOutlineWidth: number
  showHoverToolbar: boolean
  hoverToolbarPosition: HoverToolbarPosition
  selectedBlockPath: string | null
  /** When true, clicks pass through to the consumer page and the
   * hover/selection affordances are suppressed so users can interact
   * with forms, accordions, links inside the preview. */
  interactMode: boolean
  viewportWidth?: number | null
  resizable?: boolean
  onResize?: (next: number) => void
  onIframeWidthChange?: (width: number) => void
}

type BlockAction = BlockActionMessage['action']

// contentDocument throws when the iframe is cross-origin; null signals
// "skip in-iframe instrumentation" to the caller.
const getSameOriginDocument = (iframe: HTMLIFrameElement): Document | null => {
  try {
    return iframe.contentDocument
  } catch {
    return null
  }
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  previewURL,
  isPreviewEnabled,
  hoverColorTopLevel,
  hoverColorNested,
  hoverOutlineWidth,
  showHoverToolbar,
  hoverToolbarPosition,
  selectedBlockPath,
  interactMode,
  viewportWidth,
  resizable = false,
  onResize,
  onIframeWidthChange,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)
  const controllerRef = useRef<HoverToolbarController | null>(null)
  const isBoundRef = useRef(false)
  // Refs let installClickToFocus and the iframe doc body attribute read
  // the latest interact mode without re-binding the iframe instrumentation.
  const interactModeRef = useRef(interactMode)
  interactModeRef.current = interactMode
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

  const onFocusBlock = useCallback((blockId: string) => {
    postToParent({ type: 'focus-block', id: blockId })
  }, [])

  // Idempotent: tears down previous bindings before installing new ones.
  const bindToDocument = useCallback(
    (doc: Document) => {
      teardownRef.current?.()
      controllerRef.current?.destroy()
      controllerRef.current = null

      const s = settingsRef.current

      const removeStyles = installHoverStyles(doc, {
        topColor: s.hoverColorTopLevel,
        nestedColor: s.hoverColorNested,
        outlineWidth: s.hoverOutlineWidth,
      })
      const removeClick = installClickToFocus(doc, onFocusBlock, {
        isEnabled: () => !interactModeRef.current,
      })

      if (s.showHoverToolbar) {
        controllerRef.current = new HoverToolbarController(doc, {
          position: s.hoverToolbarPosition,
          outlineWidth: s.hoverOutlineWidth,
          onAction: dispatchBlockAction,
        })
      }

      isBoundRef.current = true
      teardownRef.current = () => {
        removeStyles()
        removeClick()
        controllerRef.current?.destroy()
        controllerRef.current = null
        isBoundRef.current = false
      }
    },
    [dispatchBlockAction, onFocusBlock],
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      setIsLoading(false)
      const doc = getSameOriginDocument(iframe)
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
  }, [bindToDocument])

  // Apply setting changes without recreating the controller (preserves
  // its DOM node + current selection). Skipped before the iframe load
  // commits — operating on the about:blank document would leak a
  // controller whose DOM gets wiped by navigation.
  useEffect(() => {
    if (!isBoundRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = getSameOriginDocument(iframe)
    if (!doc) return

    setHoverVars(doc, {
      topColor: hoverColorTopLevel,
      nestedColor: hoverColorNested,
      outlineWidth: hoverOutlineWidth,
    })

    if (showHoverToolbar) {
      const next: HoverToolbarOptions = {
        position: hoverToolbarPosition,
        outlineWidth: hoverOutlineWidth,
        onAction: dispatchBlockAction,
      }
      if (controllerRef.current) {
        controllerRef.current.update(next)
      } else {
        controllerRef.current = new HoverToolbarController(doc, next)
      }
    } else if (controllerRef.current) {
      controllerRef.current.destroy()
      controllerRef.current = null
      // Defensive: drop residue if a previous controller was already torn
      // down by the load-effect path and styles outlived it.
      doc.getElementById(TOOLBAR_ID)?.remove()
      doc.querySelectorAll(ACTIVE_SELECTOR).forEach((el) => el.classList.remove(ACTIVE_CLASS))
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

  const [allFields] = useAllFormFields()
  const selectedBlockId = useMemo<string | null>(() => {
    if (!selectedBlockPath) return null
    const v = allFields[`${selectedBlockPath}.id`]?.value
    return typeof v === 'string' ? v : null
  }, [allFields, selectedBlockPath])

  // Toggle the body attribute that gates hover/active CSS and click-to-focus.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = getSameOriginDocument(iframe)
    if (!doc) return
    if (interactMode) doc.body.setAttribute(INTERACT_BODY_ATTR, '')
    else doc.body.removeAttribute(INTERACT_BODY_ATTR)
  }, [interactMode])

  const { mutationToken } = useEditorHistory()
  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) return
    if (!selectedBlockId || interactMode) {
      controller.deselect()
      return
    }
    const view = iframeRef.current?.contentWindow
    const raf = view?.requestAnimationFrame(() => controller.select(selectedBlockId))
    return () => {
      if (raf !== undefined) view?.cancelAnimationFrame(raf)
    }
  }, [selectedBlockId, mutationToken, interactMode])

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
  const viewportClassName = useMemo(
    () =>
      [
        'better-editor-frame__viewport',
        constrained && 'better-editor-frame__viewport--constrained',
        resizable && 'better-editor-frame__viewport--resizable',
        isResizing && 'better-editor-frame__viewport--resizing',
      ]
        .filter(Boolean)
        .join(' '),
    [constrained, resizable, isResizing],
  )

  const iframeStyle = useMemo(
    () => (constrained ? { width: `${viewportWidth}px`, maxWidth: '100%' as const } : undefined),
    [constrained, viewportWidth],
  )

  // Iframe always lives in the same wrapper across viewport modes so React
  // doesn't remount it (which would reload the page and drop the
  // ResizeObserver registration).
  return (
    <div className={viewportClassName}>
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
        style={iframeStyle}
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
