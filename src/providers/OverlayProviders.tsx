'use client'

import React from 'react'
import { OverlayErrorBoundary } from '../components/ErrorBoundary'
import { BetterEditorSettingsProvider } from '../useBetterEditorSettings'
import { EditorHistoryProvider } from '../useEditorHistory'

export type OverlayProvidersProps = {
  onClose: () => void
  onReset?: () => void
  children: React.ReactNode
}

export const OverlayProviders: React.FC<OverlayProvidersProps> = ({
  onClose,
  onReset,
  children,
}) => (
  <OverlayErrorBoundary onClose={onClose} onReset={onReset}>
    <BetterEditorSettingsProvider>
      <EditorHistoryProvider>{children}</EditorHistoryProvider>
    </BetterEditorSettingsProvider>
  </OverlayErrorBoundary>
)
