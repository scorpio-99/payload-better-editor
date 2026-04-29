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

/**
 * Standard provider stack for the LiveEditorOverlay: error boundary
 * (with reset → clears stale selection), settings fetch + cache, and the
 * undo/redo history. Kept in its own component so the overlay's body can
 * call `useBetterEditorSettings()` / `useEditorHistory()` directly.
 */
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
