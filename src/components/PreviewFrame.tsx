'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDocumentEvents, useDocumentInfo } from '@payloadcms/ui'

import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import { ICON_SVG } from '../icons'

export type PreviewFrameProps = {
  previewURL: string | undefined
  isPreviewEnabled: boolean | undefined
  blocksField: string
  topLevelBlocksSelector: string
  hoverColorTopLevel: string
  hoverColorNested: string
  hoverOutlineWidth: number
  showHoverToolbar: boolean
  hoverToolbarPosition: HoverToolbarPosition
  /**
   * Constrains the iframe to a fixed pixel width (centered, with padding
   * around it). `null` / `undefined` = full width.
   */
  viewportWidth?: number | null
  /** When true, render two drag handles to resize the iframe live. */
  resizable?: boolean
  /** Called with the new width as the user drags (responsive mode only). */
  onResize?: (next: number) => void
  /** Called whenever the iframe's rendered pixel width changes. */
  onIframeWidthChange?: (width: number) => void
}

const HOVER_STYLE_ID = 'better-editor-hover-style'
const TOOLBAR_ID = 'better-editor-block-toolbar'

const TOOLBAR_HTML = `
  <button data-action="move-up" title="Move up" aria-label="Move block up">${ICON_SVG.chevronUp}</button>
  <button data-action="move-down" title="Move down" aria-label="Move block down">${ICON_SVG.chevronDown}</button>
  <button data-action="duplicate" title="Duplicate" aria-label="Duplicate block">${ICON_SVG.copy}</button>
  <button data-action="add" title="Add block below" aria-label="Add block below">${ICON_SVG.plus}</button>
  <button data-action="delete" title="Delete" aria-label="Delete block">${ICON_SVG.trash}</button>
`

const TOOLBAR_CSS = `
  #${TOOLBAR_ID} {
    position: absolute;
    z-index: 2147483647;
    display: none;
    gap: 2px;
    padding: 3px;
    border-radius: 4px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    font-family: system-ui, sans-serif;
  }
  #${TOOLBAR_ID}.is-visible { display: inline-flex; }
  #${TOOLBAR_ID} button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  #${TOOLBAR_ID} button:hover { background: rgba(255, 255, 255, 0.18); }
  #${TOOLBAR_ID} button[data-action="delete"]:hover { background: rgba(0, 0, 0, 0.25); }
`

const makeIdHoverCss = (top: string, nested: string, width: number) => `
  [data-better-editor-id] {
    cursor: pointer;
  }
  [data-better-editor-id]:hover:not(:has([data-better-editor-id]:hover)),
  [data-better-editor-id].better-editor-active {
    outline: ${width}px solid ${top};
    outline-offset: -${width}px;
    background-color: color-mix(in srgb, ${top} 10%, transparent);
  }
  [data-better-editor-id] [data-better-editor-id]:hover:not(:has([data-better-editor-id]:hover)),
  [data-better-editor-id] [data-better-editor-id].better-editor-active {
    outline-color: ${nested};
    background-color: color-mix(in srgb, ${nested} 10%, transparent);
  }
`

const makeLegacyHoverCss = (selector: string, top: string, width: number) => `
  ${selector} {
    cursor: pointer;
  }
  ${selector}:hover {
    outline: ${width}px solid ${top};
    outline-offset: -${width}px;
  }
`

/**
 * Renders the frontend draft URL in an iframe and wires up:
 *  - Hover highlight on blocks (via injected <style>). Prefers id-based
 *    targeting (`[data-better-editor-id]`) so nested blocks highlight
 *    individually; falls back to the legacy selector for older setups.
 *  - Click-to-focus:
 *      Primary: walk up to the nearest `[data-better-editor-id]` and post
 *        `{ type: 'focus-block', id }`. The overlay resolves the id to a
 *        form-state path. This is what enables nested-block selection
 *        (e.g. a block inside a Columns block).
 *      Fallback: walk up to the nearest match of `topLevelBlocksSelector`,
 *        derive a position-based index, and post
 *        `{ type: 'focus-block', field, index }`. Kept so older consumers
 *        without per-block ids still work.
 *  - Save forwarding: on successful save, posts `payload-document-event`
 *    into the iframe so the consumer's `<RefreshRouteOnSave />` re-fetches.
 *
 * Same-origin only. If contentDocument is inaccessible, the iframe falls
 * back to view-only (hover + click do nothing).
 */
export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  previewURL,
  isPreviewEnabled,
  blocksField,
  topLevelBlocksSelector,
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
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const hoverHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const toolbarClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const { mostRecentUpdate } = useDocumentEvents()
  const { id } = useDocumentInfo()

  const setupHoverToolbar = useCallback(
    (
      doc: Document,
      topColor: string,
      nestedColor: string,
      position: HoverToolbarPosition,
    ) => {
      let toolbar = doc.getElementById(TOOLBAR_ID) as HTMLDivElement | null
      if (!toolbar) {
        toolbar = doc.createElement('div')
        toolbar.id = TOOLBAR_ID
        toolbar.innerHTML = TOOLBAR_HTML
        doc.body.appendChild(toolbar)
      } else {
        toolbar.innerHTML = TOOLBAR_HTML
      }

      let currentBlockId: string | null = null
      let currentBlockEl: HTMLElement | null = null

      const positionToolbar = () => {
        if (!currentBlockEl || !toolbar) return
        const rect = currentBlockEl.getBoundingClientRect()
        const view = doc.defaultView
        if (!view) return
        const tbWidth = toolbar.offsetWidth || 120
        const tbHeight = toolbar.offsetHeight || 32
        const inset = 4
        const isTop = position.startsWith('top')
        const isRight = position.endsWith('right')
        const top = isTop
          ? view.scrollY + rect.top + inset
          : view.scrollY + rect.bottom - tbHeight - inset
        const left = isRight
          ? view.scrollX + rect.right - tbWidth - inset
          : view.scrollX + rect.left + inset
        toolbar.style.top = `${top}px`
        toolbar.style.left = `${left}px`
        toolbar.style.right = 'auto'
      }

      const showFor = (el: HTMLElement) => {
        const blockId = el.getAttribute('data-better-editor-id')
        if (!blockId) return
        if (currentBlockEl && currentBlockEl !== el) {
          currentBlockEl.classList.remove('better-editor-active')
        }
        currentBlockId = blockId
        currentBlockEl = el
        // Persistent outline that stays visible when cursor moves to the
        // toolbar (which sits outside the block in the DOM).
        el.classList.add('better-editor-active')
        // Toolbar matches the outline color: top-level vs nested.
        const isNested = !!el.parentElement?.closest('[data-better-editor-id]')
        toolbar!.style.background = isNested ? nestedColor : topColor
        toolbar!.classList.add('is-visible')
        // Wait for layout so offsetWidth reflects the freshly-injected DOM.
        requestAnimationFrame(positionToolbar)
      }
      const hide = () => {
        if (currentBlockEl) currentBlockEl.classList.remove('better-editor-active')
        currentBlockId = null
        currentBlockEl = null
        toolbar!.classList.remove('is-visible')
      }

      if (hoverHandlerRef.current) {
        doc.removeEventListener('mouseover', hoverHandlerRef.current)
      }
      if (scrollHandlerRef.current) {
        doc.defaultView?.removeEventListener('scroll', scrollHandlerRef.current, true)
      }
      if (toolbarClickHandlerRef.current) {
        toolbar.removeEventListener('click', toolbarClickHandlerRef.current)
      }

      const onMove = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (!target) return
        // Inside the toolbar: keep current selection (outline + visibility).
        if (toolbar && toolbar.contains(target)) return
        const el = target.closest<HTMLElement>('[data-better-editor-id]')
        if (el) {
          if (el !== currentBlockEl) showFor(el)
        } else {
          hide()
        }
      }
      const onScroll = () => positionToolbar()
      const onToolbarClick = (e: MouseEvent) => {
        const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('button[data-action]')
        if (!btn || !currentBlockId) return
        e.preventDefault()
        e.stopPropagation()
        const action = btn.getAttribute('data-action')
        window.parent.postMessage(
          { type: 'block-action', id: currentBlockId, action },
          window.location.origin,
        )
      }

      doc.addEventListener('mouseover', onMove)
      doc.defaultView?.addEventListener('scroll', onScroll, true)
      toolbar.addEventListener('click', onToolbarClick)

      hoverHandlerRef.current = onMove
      scrollHandlerRef.current = onScroll
      toolbarClickHandlerRef.current = onToolbarClick
    },
    [],
  )

  const setupIframe = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let doc: Document | null
    try {
      doc = iframe.contentDocument
    } catch {
      return
    }
    if (!doc) return

    // Re-inject style on every navigation/reload. If the rendered page
    // exposes per-block ids we use the id-based CSS so each (nested) block
    // highlights individually; otherwise fall back to the selector.
    const existing = doc.getElementById(HOVER_STYLE_ID)
    if (existing) existing.remove()
    const hasIds = doc.querySelector('[data-better-editor-id]') !== null
    const style = doc.createElement('style')
    style.id = HOVER_STYLE_ID
    style.textContent = hasIds
      ? makeIdHoverCss(hoverColorTopLevel, hoverColorNested, hoverOutlineWidth) + TOOLBAR_CSS
      : makeLegacyHoverCss(topLevelBlocksSelector, hoverColorTopLevel, hoverOutlineWidth)
    doc.head.appendChild(style)

    // Hover toolbar — id-based only. Skip if the page doesn't expose ids
    // (legacy mode) since the toolbar relies on per-block ids to dispatch
    // actions back to the parent. Also skip when the user disabled it.
    if (hasIds && showHoverToolbar) {
      setupHoverToolbar(doc, hoverColorTopLevel, hoverColorNested, hoverToolbarPosition)
    } else {
      // Clean up any toolbar from a previous setup
      const existingToolbar = doc.getElementById(TOOLBAR_ID)
      if (existingToolbar) existingToolbar.remove()
      doc
        .querySelectorAll('.better-editor-active')
        .forEach((el) => el.classList.remove('better-editor-active'))
    }

    if (clickHandlerRef.current) {
      doc.removeEventListener('click', clickHandlerRef.current, true)
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Primary path: id-based, supports any nesting depth.
      const idEl = target.closest<HTMLElement>('[data-better-editor-id]')
      if (idEl) {
        const id = idEl.getAttribute('data-better-editor-id')
        if (!id) return
        e.preventDefault()
        e.stopPropagation()
        window.postMessage(
          { type: 'focus-block', id },
          window.location.origin,
        )
        return
      }

      // Fallback: selector + position index (legacy, top-level only).
      const el = target.closest(topLevelBlocksSelector)
      if (!el) return
      const matches = Array.from(doc.querySelectorAll(topLevelBlocksSelector))
      const index = matches.indexOf(el as Element)
      if (index < 0) return

      e.preventDefault()
      e.stopPropagation()

      window.postMessage(
        { type: 'focus-block', field: blocksField, index },
        window.location.origin,
      )
    }

    doc.addEventListener('click', onClick, true)
    clickHandlerRef.current = onClick
  }, [
    blocksField,
    topLevelBlocksSelector,
    hoverColorTopLevel,
    hoverColorNested,
    hoverOutlineWidth,
    showHoverToolbar,
    hoverToolbarPosition,
    setupHoverToolbar,
  ])

  // Re-inject hover CSS when hover settings change (without waiting for the
  // iframe to navigate / re-fire onLoad).
  useEffect(() => {
    setupIframe()
  }, [setupIframe])

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

  useEffect(() => {
    return () => {
      const iframe = iframeRef.current
      if (!iframe) return
      try {
        const doc = iframe.contentDocument
        if (doc && clickHandlerRef.current) {
          doc.removeEventListener('click', clickHandlerRef.current, true)
        }
        if (doc && hoverHandlerRef.current) {
          doc.removeEventListener('mouseover', hoverHandlerRef.current)
        }
        if (doc && scrollHandlerRef.current) {
          doc.defaultView?.removeEventListener('scroll', scrollHandlerRef.current, true)
        }
      } catch {
        // ignore cross-origin
      }
      clickHandlerRef.current = null
      hoverHandlerRef.current = null
      scrollHandlerRef.current = null
      toolbarClickHandlerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mostRecentUpdate) return
    if (id != null && mostRecentUpdate.id !== id) return
    if (!previewURL) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return

    let targetOrigin: string
    try {
      targetOrigin = new URL(previewURL, window.location.origin).origin
    } catch {
      targetOrigin = window.location.origin
    }

    iframe.contentWindow.postMessage(
      { type: 'payload-document-event' },
      targetOrigin,
    )
  }, [mostRecentUpdate, id, previewURL])

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
        onLoad={setupIframe}
        style={
          constrained
            ? { width: `${viewportWidth}px`, maxWidth: '100%' }
            : undefined
        }
      />
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
