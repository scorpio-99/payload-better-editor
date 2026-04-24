'use client'

import React from 'react'

export type BetterEditorProviderProps = {
  children?: React.ReactNode
}

/**
 * Placeholder admin provider. Once the live editor UI lands, this component will
 * mount the toggle button and (when enabled) render the live editor shell.
 *
 * For now it just passes children through so the plugin is safe to register.
 */
export const BetterEditorProvider: React.FC<BetterEditorProviderProps> = ({ children }) => {
  return <>{children}</>
}
