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

const ROOT_CLASS = 'better-editor-sidebar'
const TAB_CLASS = `${ROOT_CLASS}__tab`

type SidebarTabProps = {
  tabKey: TabKey
  label: string
  active: boolean
  onSelect: (key: TabKey) => void
}

const SidebarTab: React.FC<SidebarTabProps> = ({ tabKey, label, active, onSelect }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    className={active ? `${TAB_CLASS} ${TAB_CLASS}--active` : TAB_CLASS}
    onClick={() => onSelect(tabKey)}
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

  // Auto-jump to the block tab when the iframe selects a new block.
  useEffect(() => {
    if (selectedBlockPath) setTab('block')
  }, [selectedBlockPath])

  const className = forceFullWidthFields
    ? `${ROOT_CLASS} ${ROOT_CLASS}--force-full-width`
    : ROOT_CLASS

  return (
    <div className={className}>
      <div role="tablist" className={`${ROOT_CLASS}__tabs`}>
        {TABS.map((t) => (
          <SidebarTab
            key={t.key}
            tabKey={t.key}
            label={t.label}
            active={tab === t.key}
            onSelect={setTab}
          />
        ))}
      </div>

      <div className={`${ROOT_CLASS}__content`}>
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
