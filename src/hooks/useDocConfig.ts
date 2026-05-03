'use client'

import { useDocumentInfo } from '@payloadcms/ui'

export const useDocConfig = () => {
  const { docConfig } = useDocumentInfo()
  return {
    fields: docConfig && 'fields' in docConfig ? docConfig.fields : undefined,
    slug: docConfig && 'slug' in docConfig ? docConfig.slug : '',
  }
}
