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

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'page', label: 'Page' },
  { key: 'block', label: 'Blocks' },
  { key: 'settings', label: 'Settings' },
]

type SidebarTabProps = {
  label: string
  active: boolean
  onClick: () => void
}

const SidebarTab: React.FC<SidebarTabProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    className={
      'better-editor-sidebar__tab' +
      (active ? ' better-editor-sidebar__tab--active' : '')
    }
    onClick={onClick}
  >
    {label}
  </button>
)

export const Sidebar: React.FC<SidebarProps> = ({
  selectedBlockPath,
  onClearSelection,
  onSelectPath,
  forceFullWidthFields,
  blocksField,
  addBelowRequestId = 0,
}) => {
  const [tab, setTab] = useState<TabKey>('page')

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
        {TABS.map((t) => (
          <SidebarTab
            key={t.key}
            label={t.label}
            active={tab === t.key}
            onClick={() => setTab(t.key)}
          />
        ))}
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
