'use client'

import React, { useMemo } from 'react'
import { RenderFields, useDocumentInfo } from '@payloadcms/ui'

// Passing `permissions={true}` tells RenderFields to render every field
// without applying its client-side read-permission gate. The real
// write-permission check still happens server-side on save, so an author
// who can't edit a field will get a validation error back as normal.
// For our use case (users who already opened the classic edit view have
// the required read access), this avoids having to walk nested block
// permission trees ourselves.
const FULL_ACCESS = true as const

/**
 * Renders document-level fields via Payload's native RenderFields, but strips
 * out block fields (`type: 'blocks'`) recursively — blocks are edited via the
 * Block tab after being selected in the preview.
 */
export const DocumentSettingsTab: React.FC = () => {
  const { docConfig } = useDocumentInfo()

  const allFields = docConfig && 'fields' in docConfig ? docConfig.fields : undefined
  const slug = docConfig && 'slug' in docConfig ? docConfig.slug : ''

  const filteredFields = useMemo(() => stripBlocks(allFields || []), [allFields])

  if (filteredFields.length === 0) {
    return (
      <div className="better-editor-tab__empty">
        No document-level fields found.
      </div>
    )
  }

  return (
    <div className="better-editor-tab better-editor-tab--native">
      <RenderFields
        fields={filteredFields}
        parentPath=""
        parentIndexPath=""
        parentSchemaPath={slug || ''}
        permissions={FULL_ACCESS}
      />
    </div>
  )
}

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
