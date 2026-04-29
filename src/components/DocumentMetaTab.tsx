'use client'

import React, { useMemo } from 'react'
import { RenderFields, useDocumentInfo } from '@payloadcms/ui'

const FULL_ACCESS = true as const

/**
 * Settings tab — document-level metadata fields. Mirrors what Payload's
 * classic editor shows as the right-hand sidebar (slug, publishedAt,
 * featuredImage, tags, hideHeader, customBodyClass, updatedBy, etc.).
 *
 * Detection: any top-level field with `admin.position: 'sidebar'`. This is
 * Payload's own convention, so the trennung kommt direkt aus dem Schema —
 * keine Heuristik.
 */
export const DocumentMetaTab: React.FC = () => {
  const { docConfig } = useDocumentInfo()

  const allFields = docConfig && 'fields' in docConfig ? docConfig.fields : undefined
  const slug = docConfig && 'slug' in docConfig ? docConfig.slug : ''

  const sidebarFields = useMemo(() => {
    if (!allFields) return []
    return allFields.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => f?.admin?.position === 'sidebar',
    )
  }, [allFields])

  if (sidebarFields.length === 0) {
    return (
      <div className="better-editor-tab__empty">
        No document settings.
      </div>
    )
  }

  return (
    <div className="better-editor-tab better-editor-tab--native">
      <RenderFields
        fields={sidebarFields}
        parentPath=""
        parentIndexPath=""
        parentSchemaPath={slug || ''}
        permissions={FULL_ACCESS}
      />
    </div>
  )
}
