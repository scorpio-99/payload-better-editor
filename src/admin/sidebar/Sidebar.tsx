'use client'

import React, { useEffect, useState } from 'react'
import { DocumentSettingsTab } from './DocumentSettingsTab'
import { DocumentMetaTab } from './DocumentMetaTab'
import { BlockSettingsTab } from './BlockSettingsTab'
import { ValidationSummary } from './ValidationSummary'
import { useBetterEditorT } from '../../i18n/useBetterEditorT'

export type SidebarProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
  onSelectPath: (path: string | null) => void
  forceFullWidthFields: boolean
  blocksField: string
  addBelowRequestId?: number
}

type TabKey = 'page' | 'block' | 'settings'

const ROOT_CLASS = 'better-editor-sidebar'
const TAB_CLASS = `${ROOT_CLASS}__tab`

const tabId = (key: TabKey) => `better-editor-tab-${key}`
const panelId = (key: TabKey) => `better-editor-panel-${key}`

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
    id={tabId(tabKey)}
    aria-selected={active}
    aria-controls={panelId(tabKey)}
    tabIndex={active ? 0 : -1}
    className={active ? `${TAB_CLASS} ${TAB_CLASS}--active` : TAB_CLASS}
    onClick={() => onSelect(tabKey)}
  >
    {label}
  </button>
)

// Memoized so resize-drag re-renders of the overlay skip the field tree.
export const Sidebar = React.memo(function Sidebar({
  selectedBlockPath,
  onClearSelection,
  onSelectPath,
  forceFullWidthFields,
  blocksField,
  addBelowRequestId = 0,
}: SidebarProps) {
  const t = useBetterEditorT()
  const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
    { key: 'page', label: t.sidebar.tabs.page },
    { key: 'block', label: t.sidebar.tabs.block },
    { key: 'settings', label: t.sidebar.tabs.settings },
  ]
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

      <ValidationSummary blocksField={blocksField} onSelectPath={onSelectPath} />

      <div
        className={`${ROOT_CLASS}__content`}
        role="tabpanel"
        id={panelId(tab)}
        aria-labelledby={tabId(tab)}
        tabIndex={0}
      >
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

      <SelectionAnnouncer selectedBlockPath={selectedBlockPath} />
    </div>
  )
})

// Off-screen live region announces block-selection changes to screen
// readers; visible UI updates handle sighted users via the tab switch.
const SelectionAnnouncer: React.FC<{ selectedBlockPath: string | null }> = ({
  selectedBlockPath,
}) => {
  const t = useBetterEditorT()
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="better-editor-sr-only">
      {selectedBlockPath
        ? `${t.sidebar.blockSelected}${selectedBlockPath}`
        : t.sidebar.noBlockSelected}
    </div>
  )
}
