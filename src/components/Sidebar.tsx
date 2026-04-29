'use client'

import React, { useEffect, useState } from 'react'
import { DocumentSettingsTab } from './DocumentSettingsTab'
import { DocumentMetaTab } from './DocumentMetaTab'
import { BlockSettingsTab } from './BlockSettingsTab'

export type SidebarProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
  onSelectPath: (path: string | null) => void
  forceFullWidthFields: boolean
  blocksField: string
  addBelowRequestId?: number
}

type TabKey = 'page' | 'block' | 'settings'

export const Sidebar: React.FC<SidebarProps> = ({
  selectedBlockPath,
  onClearSelection,
  onSelectPath,
  forceFullWidthFields,
  blocksField,
  addBelowRequestId = 0,
}) => {
  const [tab, setTab] = useState<TabKey>('page')

  // Auto-switch to block tab when the user picks a block in the preview.
  useEffect(() => {
    if (selectedBlockPath) setTab('block')
  }, [selectedBlockPath])

  return (
    <div
      className={
        'better-editor-sidebar' +
        (forceFullWidthFields ? ' better-editor-sidebar--force-full-width' : '')
      }
    >
      <div role="tablist" className="better-editor-sidebar__tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'page'}
          className={
            'better-editor-sidebar__tab' +
            (tab === 'page' ? ' better-editor-sidebar__tab--active' : '')
          }
          onClick={() => setTab('page')}
        >
          Page
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'block'}
          className={
            'better-editor-sidebar__tab' +
            (tab === 'block' ? ' better-editor-sidebar__tab--active' : '')
          }
          onClick={() => setTab('block')}
        >
          Blocks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'settings'}
          className={
            'better-editor-sidebar__tab' +
            (tab === 'settings' ? ' better-editor-sidebar__tab--active' : '')
          }
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="better-editor-sidebar__content">
        {tab === 'page' && <DocumentSettingsTab />}
        {tab === 'block' && (
          <BlockSettingsTab
            selectedBlockPath={selectedBlockPath}
            onClearSelection={onClearSelection}
            onSelectPath={onSelectPath}
            blocksField={blocksField}
            addBelowRequestId={addBelowRequestId}
          />
        )}
        {tab === 'settings' && <DocumentMetaTab />}
      </div>
    </div>
  )
}
