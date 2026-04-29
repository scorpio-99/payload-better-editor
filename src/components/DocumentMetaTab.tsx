'use client'

import React from 'react'
import { DocumentFieldsTab } from './DocumentFieldsTab'

/**
 * Settings tab — document-level metadata (slug, publishedAt, updatedBy,
 * featuredImage, etc.). Picks up any top-level field with
 * `admin.position: 'sidebar'` — pure Payload convention, no hardcoded
 * field names.
 */
export const DocumentMetaTab: React.FC = () => (
  <DocumentFieldsTab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter={(f: any) => f?.admin?.position === 'sidebar'}
    emptyText="No document settings."
  />
)
