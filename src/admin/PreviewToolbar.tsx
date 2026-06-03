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
}) => (
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
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
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
          title={
            interactMode
              ? 'Switch to edit mode'
              : 'Switch to interact mode (use forms, accordions, links)'
          }
          aria-label={interactMode ? 'Switch to edit mode' : 'Switch to interact mode'}
        >
          {interactMode ? <InteractIcon /> : <InteractOffIcon />}
        </button>
        <button
          type="button"
          className="better-editor-viewport__btn"
          onClick={onSidebarToggle}
          aria-pressed={sidebarCollapsed}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? <SidebarShowIcon /> : <SidebarHideIcon />}
        </button>
      </div>
    </div>
  </div>
))

const HistoryButtons: React.FC<{ history: ReturnType<typeof useEditorHistory> }> = ({
  history,
}) => (
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
