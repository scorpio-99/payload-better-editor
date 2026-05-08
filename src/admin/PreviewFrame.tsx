'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HoverToolbarPosition } from '../internal/constants'
import { postToParent } from '../internal/postmessage'
import type { BlockActionMessage } from '../preview/protocol'
import { useIframeResizeObserver } from '../hooks/useIframeResizeObserver'
import { usePreviewHandleDrag } from '../hooks/usePreviewHandleDrag'
import { useLatestRef } from '../hooks/useLatestRef'
import { usePreviewBinding } from '../hooks/usePreviewBinding'
import { usePreviewSettingsSync } from '../hooks/usePreviewSettingsSync'
import { usePreviewSelectionSync } from '../hooks/usePreviewSelectionSync'

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
  const [isLoading, setIsLoading] = useState(true)
  const interactModeRef = useLatestRef(interactMode)

  const { isResizing, onHandleMouseDown } = usePreviewHandleDrag({
    resizable,
    viewportWidth,
    onResize,
  })
  useIframeResizeObserver(iframeRef, onIframeWidthChange)

  useEffect(() => {
    setIsLoading(true)
  }, [previewURL])

  const onFocusBlock = useCallback((id: string) => {
    postToParent({ type: 'focus-block', id })
  }, [])

  const onBlockAction = useCallback((id: string, action: BlockAction) => {
    postToParent({ type: 'block-action', id, action })
  }, [])

  const settings = useMemo(
    () => ({
      hoverColorTopLevel,
      hoverColorNested,
      hoverOutlineWidth,
      showHoverToolbar,
      hoverToolbarPosition,
    }),
    [
      hoverColorTopLevel,
      hoverColorNested,
      hoverOutlineWidth,
      showHoverToolbar,
      hoverToolbarPosition,
    ],
  )

  const { controllerRef, isBoundRef } = usePreviewBinding({
    iframeRef,
    settings,
    interactModeRef,
    onFocusBlock,
    onBlockAction,
    onLoadingChange: setIsLoading,
  })

  usePreviewSettingsSync({
    iframeRef,
    controllerRef,
    isBoundRef,
    settings,
    onBlockAction,
  })

  usePreviewSelectionSync({
    iframeRef,
    controllerRef,
    selectedBlockPath,
    interactMode,
    previewURL,
  })

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
