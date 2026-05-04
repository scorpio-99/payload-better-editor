'use client'

import React from 'react'
import type { ClientField, ClientTab } from 'payload'
import { DocumentFieldsTab } from './DocumentFieldsTab'

const isNotSidebar = (f: ClientField): boolean =>
  !('admin' in f) || f.admin?.position !== 'sidebar'

const stripBlocks = (fields: ClientField[]): ClientField[] => {
  const result: ClientField[] = []
  for (const field of fields) {
    if (!field || typeof field !== 'object') {
      result.push(field)
      continue
    }
    const type = field.type

    if (type === 'blocks') continue

    if (type === 'tabs') {
      const newTabs: ClientTab[] = field.tabs.map((tab) => ({
        ...tab,
        fields: stripBlocks(tab.fields || []),
      }))
      const nonEmptyTabs = newTabs.filter((t) => (t.fields?.length ?? 0) > 0)
      if (nonEmptyTabs.length === 0) continue
      result.push({ ...field, tabs: nonEmptyTabs })
      continue
    }

    if (type === 'collapsible' || type === 'row' || type === 'group') {
      const inner = stripBlocks(field.fields)
      if (inner.length === 0) continue
      result.push({ ...field, fields: inner })
      continue
    }

    result.push(field)
  }
  return result
}

export const DocumentSettingsTab: React.FC = () => (
  <DocumentFieldsTab
    filter={isNotSidebar}
    transform={stripBlocks}
    emptyText="No document-level fields found."
  />
)
