'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useDocumentEvents, useDocumentInfo } from '@payloadcms/ui'

export type PreviewFrameProps = {
  previewURL: string | undefined
  isPreviewEnabled: boolean | undefined
  blocksField: string
  topLevelBlocksSelector: string
}

const HOVER_STYLE_ID = 'better-editor-hover-style'

const makeHoverCss = (selector: string) => `
  ${selector} {
    cursor: pointer;
  }
  ${selector}:hover {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }
`

/**
 * Renders the frontend draft URL in an iframe and wires up:
 *  - Hover highlight on top-level blocks (via injected <style>)
 *  - Click-to-focus: on click, the handler walks up to the nearest element
 *    matching `topLevelBlocksSelector`, looks up its position among the
 *    matching siblings to derive the block's index, and posts
 *    `{ type: 'focus-block', field, index }` back to the overlay.
 *  - Save forwarding: on successful save, posts `payload-document-event` into
 *    the iframe so the consumer's `<RefreshRouteOnSave />` re-fetches.
 *
 * Same-origin only. If contentDocument is inaccessible, the iframe falls
 * back to view-only (hover + click do nothing).
 */
export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  previewURL,
  isPreviewEnabled,
  blocksField,
  topLevelBlocksSelector,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const { mostRecentUpdate } = useDocumentEvents()
  const { id } = useDocumentInfo()

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

    // Re-inject style on every navigation/reload
    const existing = doc.getElementById(HOVER_STYLE_ID)
    if (existing) existing.remove()
    const style = doc.createElement('style')
    style.id = HOVER_STYLE_ID
    style.textContent = makeHoverCss(topLevelBlocksSelector)
    doc.head.appendChild(style)

    if (clickHandlerRef.current) {
      doc.removeEventListener('click', clickHandlerRef.current, true)
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const el = target.closest(topLevelBlocksSelector)
      if (!el) return

      // Derive index by position among siblings that match the selector.
      // Using the shared matching set keeps things correct when the selector
      // matches non-adjacent elements (e.g. `.page > [data-block]`).
      const matches = Array.from(doc.querySelectorAll(topLevelBlocksSelector))
      const index = matches.indexOf(el as Element)
      if (index < 0) return

      // In editor mode, clicks focus the block instead of navigating
      e.preventDefault()
      e.stopPropagation()

      window.postMessage(
        { type: 'focus-block', field: blocksField, index },
        window.location.origin,
      )
    }

    doc.addEventListener('click', onClick, true)
    clickHandlerRef.current = onClick
  }, [blocksField, topLevelBlocksSelector])

  useEffect(() => {
    return () => {
      const iframe = iframeRef.current
      if (!iframe || !clickHandlerRef.current) return
      try {
        iframe.contentDocument?.removeEventListener(
          'click',
          clickHandlerRef.current,
          true,
        )
      } catch {
        // ignore cross-origin
      }
      clickHandlerRef.current = null
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

  return (
    <iframe
      ref={iframeRef}
      className="better-editor-frame"
      src={previewURL}
      title="Better Editor preview"
      onLoad={setupIframe}
    />
  )
}
