'use client'

import React from 'react'
import { DocumentFieldsTab } from './DocumentFieldsTab'

/**
 * Page tab — main-column content fields (Hero / Content / SEO / title).
 * Excludes sidebar-positioned fields (those go to the Settings tab) and
 * any `type: 'blocks'` field recursively (those are edited via the
 * Blocks tab after being selected in the preview).
 */
export const DocumentSettingsTab: React.FC = () => (
  <DocumentFieldsTab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter={(f: any) => f?.admin?.position !== 'sidebar'}
    transform={stripBlocks}
    emptyText="No document-level fields found."
  />
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripBlocks(fields: any[]): any[] {
  const result: any[] = []
  for (const field of fields) {
    if (!field || typeof field !== 'object') {
      result.push(field)
      continue
    }
    const type = field.type

    if (type === 'blocks') continue

    if (type === 'tabs' && Array.isArray(field.tabs)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newTabs = field.tabs.map((tab: any) => ({
        ...tab,
        fields: stripBlocks(tab.fields || []),
      }))
      // Drop tabs that end up empty so we don't leave a dangling header
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nonEmptyTabs = newTabs.filter((t: any) => (t.fields?.length ?? 0) > 0)
      if (nonEmptyTabs.length === 0) continue
      result.push({ ...field, tabs: nonEmptyTabs })
      continue
    }

    if ((type === 'collapsible' || type === 'row' || type === 'group') && Array.isArray(field.fields)) {
      const inner = stripBlocks(field.fields)
      if (inner.length === 0) continue
      result.push({ ...field, fields: inner })
      continue
    }

    result.push(field)
  }
  return result
}
