'use client'

import React, { useCallback, useState } from 'react'
import { useLivePreviewContext } from '@payloadcms/ui'
import { PreviewFrame } from './components/PreviewFrame'
import { Sidebar } from './components/Sidebar'
import { ViewportToggle } from './components/ViewportToggle'
import { useBetterEditorSettings } from './useBetterEditorSettings'
import { useEditorHistory } from './useEditorHistory'
import { useSidebarResize } from './hooks/useSidebarResize'
import { useViewportState } from './hooks/useViewportState'
import { useFullscreenOverlay } from './hooks/useFullscreenOverlay'
import { useBlockActionMessages } from './hooks/useBlockActionMessages'
import { useOverlayKeyboard } from './hooks/useOverlayKeyboard'
import { OverlayProviders } from './providers/OverlayProviders'
import { RedoIcon, UndoIcon } from './icons'
import './styles.css'

export type LiveEditorOverlayProps = {
  onClose: () => void
  blocksField: string
}

const RESIZE_HANDLE_PX = 6

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ')

export const LiveEditorOverlay: React.FC<LiveEditorOverlayProps> = ({
  onClose,
  blocksField,
}) => {
  // Selection state lives outside OverlayProviders so the error boundary's
  // onReset can clear it without remounting providers.
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const clearSelection = useCallback(() => setSelectedBlockPath(null), [])

  return (
    <OverlayProviders onClose={onClose} onReset={clearSelection}>
      <LiveEditorOverlayInner
        onClose={onClose}
        blocksField={blocksField}
        selectedBlockPath={selectedBlockPath}
        setSelectedBlockPath={setSelectedBlockPath}
      />
    </OverlayProviders>
  )
}

type InnerProps = LiveEditorOverlayProps & {
  selectedBlockPath: string | null
  setSelectedBlockPath: React.Dispatch<React.SetStateAction<string | null>>
}

const LiveEditorOverlayInner: React.FC<InnerProps> = ({
  onClose,
  blocksField,
  selectedBlockPath,
  setSelectedBlockPath,
}) => {
  const settings = useBetterEditorSettings()
  const history = useEditorHistory()
  const { previewURL, isPreviewEnabled } = useLivePreviewContext()

  const { sidebarWidth, isResizing, onResizeStart } = useSidebarResize(settings.sidebarPosition)
  const {
    viewport,
    setViewport,
    setResponsiveWidth,
    iframeWidth,
    setIframeWidth,
    viewportWidth,
    isFullscreen,
  } = useViewportState(settings)

  const exitFullscreen = useCallback(() => setViewport('desktop'), [setViewport])
  const overlayRef = useFullscreenOverlay(isFullscreen, exitFullscreen)

  const clearSelection = useCallback(
    () => setSelectedBlockPath(null),
    [setSelectedBlockPath],
  )

  const { addBelowRequestId } = useBlockActionMessages({
    selectedBlockPath,
    setSelectedBlockPath,
  })

  useOverlayKeyboard({ onClose, history })

  const isLeft = settings.sidebarPosition === 'left'
  const sidebarTrack = `${sidebarWidth}px ${RESIZE_HANDLE_PX}px`
  const gridTemplateColumns = isFullscreen
    ? '1fr'
    : isLeft
      ? `${sidebarTrack} 1fr`
      : `1fr ${sidebarTrack}`

  return (
    <div
      ref={overlayRef}
      className={cx(
        'better-editor',
        isResizing && 'better-editor--resizing',
        isFullscreen && 'better-editor--fullscreen',
      )}
      role="dialog"
      aria-label="Better Editor"
    >
      <div className="better-editor__body" style={{ gridTemplateColumns }}>
        <div className="better-editor__preview" style={{ order: isLeft ? 2 : 0 }}>
          <div className="better-editor__preview-toolbar">
            <HistoryToolbar history={history} />
            <div className="better-editor__preview-toolbar-right">
              {iframeWidth ? (
                <span className="better-editor__width-chip" aria-live="polite">
                  {iframeWidth}
                  <span className="better-editor__width-chip-unit">px</span>
                </span>
              ) : null}
              <ViewportToggle value={viewport} onChange={setViewport} />
            </div>
          </div>
          <div className="better-editor__preview-stage">
            <PreviewFrame
              previewURL={previewURL}
              isPreviewEnabled={isPreviewEnabled}
              hoverColorTopLevel={settings.hoverColorTopLevel}
              hoverColorNested={settings.hoverColorNested}
              hoverOutlineWidth={settings.hoverOutlineWidth}
              showHoverToolbar={settings.showHoverToolbar}
              hoverToolbarPosition={settings.hoverToolbarPosition}
              viewportWidth={viewportWidth}
              resizable={viewport === 'responsive'}
              onResize={setResponsiveWidth}
              onIframeWidthChange={setIframeWidth}
            />
          </div>
        </div>
        {!isFullscreen ? (
          <>
            <div
              className="better-editor__resize-handle"
              style={{ order: 1 }}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              onMouseDown={onResizeStart}
            />
            <aside
              className="better-editor__sidebar"
              style={{ order: isLeft ? 0 : 2 }}
            >
              <Sidebar
                selectedBlockPath={selectedBlockPath}
                onClearSelection={clearSelection}
                onSelectPath={setSelectedBlockPath}
                forceFullWidthFields={settings.forceFullWidthFields}
                blocksField={blocksField}
                addBelowRequestId={addBelowRequestId}
              />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  )
}

type HistoryToolbarProps = {
  history: ReturnType<typeof useEditorHistory>
}

const HistoryToolbar: React.FC<HistoryToolbarProps> = ({ history }) => (
  <div className="better-editor__history">
    <button
      type="button"
      className="better-editor__history-btn"
      onClick={history.undo}
      disabled={!history.canUndo}
      title="Undo (Cmd/Ctrl+Z)"
      aria-label="Undo"
    >
      <UndoIcon />
    </button>
    <button
      type="button"
      className="better-editor__history-btn"
      onClick={history.redo}
      disabled={!history.canRedo}
      title="Redo (Cmd/Ctrl+Shift+Z)"
      aria-label="Redo"
    >
      <RedoIcon />
    </button>
  </div>
)
