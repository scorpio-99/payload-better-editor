'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useLivePreviewContext } from '@payloadcms/ui'
import { PreviewFrame } from './PreviewFrame'
import { PreviewToolbar } from './PreviewToolbar'
import { Sidebar } from './sidebar/Sidebar'
import { useBetterEditorSettings } from '../state/useBetterEditorSettings'
import { useEditorHistory } from '../state/useEditorHistory'
import { useSidebarResize } from '../hooks/useSidebarResize'
import { useViewportState } from '../hooks/useViewportState'
import { useFullscreenOverlay } from '../hooks/useFullscreenOverlay'
import { useBlockActionMessages } from '../hooks/useBlockActionMessages'
import { useOverlayKeyboard } from '../hooks/useOverlayKeyboard'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { OverlayProviders } from '../providers/OverlayProviders'
import '../styles/overlay.css'
import '../styles/preview.css'
import '../styles/sidebar.css'
import '../styles/blocks-tab.css'

export type LiveEditorOverlayProps = {
  onClose: () => void
  blocksField: string
  storageNamespace?: string
  adminPortalSelector?: string
}

const RESIZE_HANDLE_PX = 6

const classes = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ')

export const LiveEditorOverlay: React.FC<LiveEditorOverlayProps> = ({
  onClose,
  blocksField,
  storageNamespace,
  adminPortalSelector,
}) => {
  // Selection state lives outside OverlayProviders so the error boundary's
  // onReset can clear it without remounting providers.
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const clearSelection = useCallback(() => setSelectedBlockPath(null), [])

  return (
    <OverlayProviders
      onClose={onClose}
      onReset={clearSelection}
      storageNamespace={storageNamespace}
      adminPortalSelector={adminPortalSelector}
    >
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
  const { previewURL } = useLivePreviewContext()

  const { sidebarWidth, isResizing, onResizeStart, onResizeKeyDown } = useSidebarResize(
    settings.sidebarPosition,
  )
  const {
    viewport,
    setViewport,
    setResponsiveWidth,
    viewportWidth,
  } = useViewportState(settings)
  // Shared with the toolbar's width chip, which measures the iframe directly.
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), [])
  const exitFullscreen = useCallback(() => setIsFullscreen(false), [])
  const overlayRef = useFullscreenOverlay(isFullscreen, exitFullscreen)
  useFocusTrap(overlayRef)

  const clearSelection = useCallback(
    () => setSelectedBlockPath(null),
    [setSelectedBlockPath],
  )

  const { addBelowRequestId } = useBlockActionMessages({
    selectedBlockPath,
    setSelectedBlockPath,
  })

  useOverlayKeyboard({ onClose, history })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), [])

  const [interactMode, setInteractMode] = useState(false)
  const toggleInteractMode = useCallback(() => setInteractMode((v) => !v), [])

  const isLeft = settings.sidebarPosition === 'left'
  const showSidebar = !sidebarCollapsed
  const gridTemplateColumns = !showSidebar
    ? '1fr'
    : isLeft
      ? `${sidebarWidth}px ${RESIZE_HANDLE_PX}px 1fr`
      : `1fr ${RESIZE_HANDLE_PX}px ${sidebarWidth}px`

  return (
    <div
      ref={overlayRef}
      className={classes(
        'better-editor',
        isResizing && 'better-editor--resizing',
        isFullscreen && 'better-editor--fullscreen',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Better Editor"
      tabIndex={-1}
    >
      <div className="better-editor__body" style={{ gridTemplateColumns }}>
        <div className="better-editor__preview" style={{ order: isLeft ? 2 : 0 }}>
          <PreviewToolbar
            history={history}
            viewport={viewport}
            onViewportChange={setViewport}
            iframeRef={iframeRef}
            isFullscreen={isFullscreen}
            onFullscreenToggle={toggleFullscreen}
            interactMode={interactMode}
            onInteractToggle={toggleInteractMode}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={toggleSidebar}
          />
          <div className="better-editor__preview-stage">
            <PreviewFrame
              iframeRef={iframeRef}
              previewURL={previewURL}
              hoverColorTopLevel={settings.hoverColorTopLevel}
              hoverColorNested={settings.hoverColorNested}
              hoverOutlineWidth={settings.hoverOutlineWidth}
              showHoverToolbar={settings.showHoverToolbar}
              hoverToolbarPosition={settings.hoverToolbarPosition}
              selectedBlockPath={selectedBlockPath}
              interactMode={interactMode}
              viewport={viewport}
              viewportWidth={viewportWidth}
              resizable={viewport === 'responsive'}
              onResize={setResponsiveWidth}
            />
          </div>
        </div>
        {showSidebar ? (
          <>
            <div
              className="better-editor__resize-handle"
              style={{ order: 1 }}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar (use ← / → arrow keys)"
              aria-valuenow={sidebarWidth}
              tabIndex={0}
              onMouseDown={onResizeStart}
              onKeyDown={onResizeKeyDown}
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

