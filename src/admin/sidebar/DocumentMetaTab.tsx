'use client'

import React from 'react'
import type { ClientField } from 'payload'
import { DocumentFieldsTab } from './DocumentFieldsTab'

const isSidebarField = (f: ClientField): boolean =>
  'admin' in f && f.admin?.position === 'sidebar'

export const DocumentMetaTab: React.FC = () => (
  <DocumentFieldsTab
    filter={isSidebarField}
    emptyText="No document settings."
  />
)
