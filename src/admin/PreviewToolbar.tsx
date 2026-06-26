'use client'

import React, { type RefObject } from 'react'
import { ViewportToggle, type Viewport } from './ViewportToggle'
import { WidthChip } from './WidthChip'
import {
  FullscreenExitIcon,
  FullscreenIcon,
  InteractIcon,
  InteractOffIcon,
  RedoIcon,
  SidebarHideIcon,
  SidebarShowIcon,
  UndoIcon,
} from './icons'
import type { useEditorHistory } from '../state/useEditorHistory'
import { useBetterEditorT } from '../i18n/useBetterEditorT'

export type PreviewToolbarProps = {
  history: ReturnType<typeof useEditorHistory>
  viewport: Viewport
  onViewportChange: (viewport: Viewport) => void
  iframeRef: RefObject<HTMLIFrameElement | null>
  isFullscreen: boolean
  onFullscreenToggle: () => void
  interactMode: boolean
  onInteractToggle: () => void
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
}

// Memoized so resize-drag re-renders of the overlay skip the toolbar.
export const PreviewToolbar = React.memo<PreviewToolbarProps>(({
  history,
  viewport,
  onViewportChange,
  iframeRef,
  isFullscreen,
  onFullscreenToggle,
  interactMode,
  onInteractToggle,
  sidebarCollapsed,
  onSidebarToggle,
}) => {
  const t = useBetterEditorT()
  return (
    <div className="better-editor__preview-toolbar">
      <HistoryButtons history={history} />
      <div className="better-editor__preview-toolbar-right">
        <WidthChip iframeRef={iframeRef} />
        <ViewportToggle value={viewport} onChange={onViewportChange} />
        <div className="better-editor-viewport">
          <button
            type="button"
            className={
              isFullscreen
                ? 'better-editor-viewport__btn better-editor-viewport__btn--active'
                : 'better-editor-viewport__btn'
            }
            onClick={onFullscreenToggle}
            aria-pressed={isFullscreen}
            title={isFullscreen ? t.toolbar.exitFullscreen : t.toolbar.enterFullscreen}
            aria-label={isFullscreen ? t.toolbar.exitFullscreen : t.toolbar.enterFullscreen}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </button>
          <button
            type="button"
            className={
              interactMode
                ? 'better-editor-viewport__btn better-editor-viewport__btn--active'
                : 'better-editor-viewport__btn'
            }
            onClick={onInteractToggle}
            aria-pressed={interactMode}
            title={interactMode ? t.toolbar.switchToEdit : t.toolbar.switchToInteract}
            aria-label={interactMode ? t.toolbar.switchToEdit : t.toolbar.switchToInteractShort}
          >
            {interactMode ? <InteractIcon /> : <InteractOffIcon />}
          </button>
          <button
            type="button"
            className="better-editor-viewport__btn"
            onClick={onSidebarToggle}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? t.toolbar.showSidebar : t.toolbar.hideSidebar}
            aria-label={sidebarCollapsed ? t.toolbar.showSidebar : t.toolbar.hideSidebar}
          >
            {sidebarCollapsed ? <SidebarShowIcon /> : <SidebarHideIcon />}
          </button>
        </div>
      </div>
    </div>
  )
})

const HistoryButtons: React.FC<{ history: ReturnType<typeof useEditorHistory> }> = ({
  history,
}) => {
  const t = useBetterEditorT()
  return (
    <div className="better-editor__history">
      <button
        type="button"
        className="better-editor__history-btn"
        onClick={history.undo}
        disabled={!history.canUndo}
        title={t.toolbar.undoTitle}
        aria-label={t.toolbar.undo}
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        className="better-editor__history-btn"
        onClick={history.redo}
        disabled={!history.canRedo}
        title={t.toolbar.redoTitle}
        aria-label={t.toolbar.redo}
      >
        <RedoIcon />
      </button>
    </div>
  )
}
