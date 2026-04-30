'use client'

import { useDocumentInfo } from '@payloadcms/ui'

/** Narrow `useDocumentInfo()` to `{ fields, slug }` with optional-prop guards. */
export const useDocConfig = () => {
  const { docConfig } = useDocumentInfo()
  return {
    fields: docConfig && 'fields' in docConfig ? docConfig.fields : undefined,
    slug: docConfig && 'slug' in docConfig ? docConfig.slug : '',
  }
}
