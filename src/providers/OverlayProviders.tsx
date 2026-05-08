'use client'

import React from 'react'
import { OverlayErrorBoundary } from '../admin/ErrorBoundary'
import { BetterEditorSettingsProvider } from '../state/useBetterEditorSettings'
import { EditorHistoryProvider } from '../state/useEditorHistory'
import {
  BetterEditorConfigProvider,
  type BetterEditorConfigProviderProps,
} from './BetterEditorConfigProvider'

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
