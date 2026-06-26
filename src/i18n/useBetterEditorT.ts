'use client'

import { useTranslation } from '@payloadcms/ui'
import type { BetterEditorTranslations } from './types'
import { en } from './en'

export const useBetterEditorT = (): BetterEditorTranslations => {
  const { i18n } = useTranslation()
  const custom = (i18n.translations as Record<string, unknown>)?.betterEditor
  return (custom as BetterEditorTranslations | undefined) ?? en
}
