'use client'

import React from 'react'
import { useBetterEditorT } from '../../i18n/useBetterEditorT'

export type BlockHeaderProps = {
  blockType: string
  path: string
  onClearSelection: () => void
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  blockType,
  path,
  onClearSelection,
}) => {
  const t = useBetterEditorT()
  return (
    <div className="better-editor-tab__header">
      <div>
        <span className="better-editor-tab__kicker">Block</span>
        <h3 className="better-editor-tab__heading">{blockType}</h3>
        <code className="better-editor-tab__path">{path}</code>
      </div>
      <button
        type="button"
        className="better-editor-tab__clear"
        onClick={onClearSelection}
      >
        {t.blocks.deselect}
      </button>
    </div>
  )
}
