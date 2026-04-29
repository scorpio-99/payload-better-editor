'use client'

import React, { useMemo } from 'react'
import { RenderFields } from '@payloadcms/ui'
import { useDocConfig } from '../hooks/useDocConfig'

// `permissions={true}` skips RenderFields' client-side read gate; the
// server-side write check still runs on save.
const FULL_ACCESS = true as const

export type DocumentFieldsTabProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: (field: any) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform?: (fields: any[]) => any[]
  emptyText: string
}

/** Shared base for the Page and Settings tabs. */
export const DocumentFieldsTab: React.FC<DocumentFieldsTabProps> = ({
  filter,
  transform,
  emptyText,
}) => {
  const { fields: allFields, slug } = useDocConfig()

  const fields = useMemo(() => {
    if (!allFields) return []
    const filtered = allFields.filter(filter)
    return transform ? transform(filtered) : filtered
  }, [allFields, filter, transform])

  if (fields.length === 0) {
    return <div className="better-editor-tab__empty">{emptyText}</div>
  }

  return (
    <div className="better-editor-tab better-editor-tab--native">
      <RenderFields
        fields={fields}
        parentPath=""
        parentIndexPath=""
        parentSchemaPath={slug || ''}
        permissions={FULL_ACCESS}
      />
    </div>
  )
}
