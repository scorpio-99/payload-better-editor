'use client'

import React from 'react'
import { PlusIcon } from '../../icons'

export type BlockEmptyStateProps = {
  canAdd: boolean
  onAddClick: () => void
}

export const BlockEmptyState: React.FC<BlockEmptyStateProps> = ({ canAdd, onAddClick }) => (
  <div className="better-editor-tab better-editor-tab--empty">
    <p className="better-editor-tab__empty-text">
      Select a block in the preview to edit its settings.
    </p>
    {canAdd ? (
      <button
        type="button"
        className="better-editor-tab__add-block"
        onClick={onAddClick}
      >
        <PlusIcon />
        <span>Add Block</span>
      </button>
    ) : null}
  </div>
)
