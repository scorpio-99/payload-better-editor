'use client'

import React, { useMemo } from 'react'
import type { ClientField } from 'payload'
import { RenderFields } from '@payloadcms/ui'
import { useDocConfig } from '../../hooks/useDocConfig.js'

// Bypass RenderFields' client-side read gate; the server still enforces
// access on save.
const FULL_ACCESS = true as const

export type DocumentFieldsTabProps = {
  filter: (field: ClientField) => boolean
  transform?: (fields: ClientField[]) => ClientField[]
  emptyText: string
}

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
        parentSchemaPath={slug}
        permissions={FULL_ACCESS}
      />
    </div>
  )
}
