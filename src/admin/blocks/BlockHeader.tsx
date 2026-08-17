'use client'

import React from 'react'
import { useBetterEditorT } from '../../i18n/useBetterEditorT.js'

export type BlockHeaderProps = {
  blockType: string
  blockLabel?: string
  path: string
  onClearSelection: () => void
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  blockType,
  blockLabel,
  path,
  onClearSelection,
}) => {
  const t = useBetterEditorT()
  return (
    <div className="better-editor-tab__header">
      <div>
        <span className="better-editor-tab__kicker">{t.blocks.kicker}</span>
        <h3
          className="better-editor-tab__heading"
          title={blockLabel ? `${blockType} | ${path}` : path}
        >
          {blockLabel || blockType}
        </h3>
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
