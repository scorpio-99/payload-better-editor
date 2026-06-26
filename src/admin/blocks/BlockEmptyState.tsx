'use client'

import React from 'react'
import { PlusIcon } from '../icons'
import { useBetterEditorT } from '../../i18n/useBetterEditorT'

export type BlockEmptyStateProps = {
  canAdd: boolean
  onAddClick: () => void
}

export const BlockEmptyState: React.FC<BlockEmptyStateProps> = ({ canAdd, onAddClick }) => {
  const t = useBetterEditorT()
  return (
    <div className="better-editor-tab better-editor-tab--empty">
      <p className="better-editor-tab__empty-text">{t.blocks.emptyPrompt}</p>
      {canAdd ? (
        <button type="button" className="better-editor-tab__add-block" onClick={onAddClick}>
          <PlusIcon />
          <span>{t.blocks.addBlock}</span>
        </button>
      ) : null}
    </div>
  )
}
