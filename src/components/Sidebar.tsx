'use client'

import React, { useEffect, useState } from 'react'
import { DocumentSettingsTab } from './DocumentSettingsTab'
import { BlockSettingsTab } from './BlockSettingsTab'

export type SidebarProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
  forceFullWidthFields: boolean
}

type TabKey = 'page' | 'block'

export const Sidebar: React.FC<SidebarProps> = ({
  selectedBlockPath,
  onClearSelection,
  forceFullWidthFields,
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
          disabled={!selectedBlockPath}
          className={
            'better-editor-sidebar__tab' +
            (tab === 'block' ? ' better-editor-sidebar__tab--active' : '')
          }
          onClick={() => setTab('block')}
        >
          Block
        </button>
      </div>

      <div className="better-editor-sidebar__content">
        {tab === 'page' && <DocumentSettingsTab />}
        {tab === 'block' && (
          <BlockSettingsTab
            selectedBlockPath={selectedBlockPath}
            onClearSelection={onClearSelection}
          />
        )}
      </div>
    </div>
  )
}
