'use client'

import React from 'react'
import { OverlayErrorBoundary } from '../admin/ErrorBoundary.js'
import { BetterEditorSettingsProvider } from '../state/useBetterEditorSettings.js'
import { EditorHistoryProvider } from '../state/useEditorHistory.js'
import {
  BetterEditorConfigProvider,
  type BetterEditorConfigProviderProps,
} from './BetterEditorConfigProvider.js'

export type OverlayProvidersProps = {
  onClose: () => void
  onReset?: () => void
  children: React.ReactNode
} & Pick<BetterEditorConfigProviderProps, 'storageNamespace' | 'adminPortalSelector'>

export const OverlayProviders: React.FC<OverlayProvidersProps> = ({
  onClose,
  onReset,
  children,
  storageNamespace,
  adminPortalSelector,
}) => (
  <OverlayErrorBoundary onClose={onClose} onReset={onReset}>
    <BetterEditorConfigProvider
      storageNamespace={storageNamespace}
      adminPortalSelector={adminPortalSelector}
    >
      <BetterEditorSettingsProvider>
        <EditorHistoryProvider>{children}</EditorHistoryProvider>
      </BetterEditorSettingsProvider>
    </BetterEditorConfigProvider>
  </OverlayErrorBoundary>
)
