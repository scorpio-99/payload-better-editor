'use client'

import React from 'react'
import { ViewportToggle, type Viewport } from './ViewportToggle'
import {
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
  iframeWidth: number | null
  interactMode: boolean
  onInteractToggle: () => void
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  history,
  viewport,
  onViewportChange,
  iframeWidth,
  interactMode,
  onInteractToggle,
  sidebarCollapsed,
  onSidebarToggle,
}) => (
  <div className="better-editor__preview-toolbar">
    <HistoryButtons history={history} />
    <div className="better-editor__preview-toolbar-right">
      {iframeWidth ? (
        <span className="better-editor__width-chip" aria-live="polite">
          {iframeWidth}
          <span className="better-editor__width-chip-unit">px</span>
        </span>
      ) : null}
      <ViewportToggle value={viewport} onChange={onViewportChange} />
      <div className="better-editor-viewport">
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
)

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
