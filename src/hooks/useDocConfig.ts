'use client'

import { useMemo } from 'react'
import type { ClientField } from 'payload'
import { useDocumentInfo } from '@payloadcms/ui'

export type UseDocConfigReturn = {
  fields: ClientField[] | undefined
  slug: string
}

export const useDocConfig = (): UseDocConfigReturn => {
  const { docConfig } = useDocumentInfo()
  return useMemo(() => {
    const fields =
      docConfig && 'fields' in docConfig ? (docConfig.fields as ClientField[]) : undefined
    const slug = docConfig && 'slug' in docConfig ? docConfig.slug : ''
    return { fields, slug }
  }, [docConfig])
}
