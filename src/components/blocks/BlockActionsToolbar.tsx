'use client'

import React from 'react'
import { ChevronDown, ChevronUp, CopyIcon, PlusIcon, TrashIcon } from '../../icons'

export type BlockActionsToolbarProps = {
  canMoveUp: boolean
  canMoveDown: boolean
  /** When false the toolbar renders nothing. */
  canMutate: boolean
  /** When false the "Add below" button is disabled (no parent blocks list). */
  canAddBelow: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onAddBelow: () => void
  onDelete: () => void
}

export const BlockActionsToolbar: React.FC<BlockActionsToolbarProps> = ({
  canMoveUp,
  canMoveDown,
  canMutate,
  canAddBelow,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddBelow,
  onDelete,
}) => {
  if (!canMutate) return null
  return (
    <div className="better-editor-tab__actions" role="toolbar" aria-label="Block actions">
      <button
        type="button"
        className="better-editor-tab__action"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Move up"
        aria-label="Move block up"
      >
        <ChevronUp />
      </button>
      <button
        type="button"
        className="better-editor-tab__action"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Move down"
        aria-label="Move block down"
      >
        <ChevronDown />
      </button>
      <button
        type="button"
        className="better-editor-tab__action"
        onClick={onDuplicate}
        title="Duplicate"
        aria-label="Duplicate block"
      >
        <CopyIcon />
      </button>
      <button
        type="button"
        className="better-editor-tab__action"
        onClick={onAddBelow}
        disabled={!canAddBelow}
        title="Add block below"
        aria-label="Add block below"
      >
        <PlusIcon />
      </button>
      <button
        type="button"
        className="better-editor-tab__action better-editor-tab__action--danger"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete block"
      >
        <TrashIcon />
      </button>
    </div>
  )
}
