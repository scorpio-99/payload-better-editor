'use client'

import React from 'react'
import type { ClientField } from 'payload'
import { DocumentFieldsTab } from './DocumentFieldsTab.js'
import { useBetterEditorT } from '../../i18n/useBetterEditorT.js'

const isSidebarField = (f: ClientField): boolean =>
  'admin' in f && f.admin?.position === 'sidebar'

export const DocumentMetaTab: React.FC = () => {
  const t = useBetterEditorT()
  return <DocumentFieldsTab filter={isSidebarField} emptyText={t.documentFields.noSettings} />
}
