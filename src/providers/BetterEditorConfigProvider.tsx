'use client'

import React, { createContext, useContext, useMemo } from 'react'
import {
  buildStorageKeys,
  DEFAULT_STORAGE_KEYS,
  DEFAULT_STORAGE_NAMESPACE,
  type StorageKeys,
} from '../internal/storage-keys'

export type BetterEditorRuntimeConfig = {
  storageKeys: StorageKeys
  storageNamespace: string
  adminPortalSelector?: string
}

const DEFAULT_RUNTIME_CONFIG: BetterEditorRuntimeConfig = {
  storageKeys: DEFAULT_STORAGE_KEYS,
  storageNamespace: DEFAULT_STORAGE_NAMESPACE,
}

const Ctx = createContext<BetterEditorRuntimeConfig>(DEFAULT_RUNTIME_CONFIG)

export const useBetterEditorConfig = (): BetterEditorRuntimeConfig => useContext(Ctx)

export type BetterEditorConfigProviderProps = {
  children: React.ReactNode
  storageNamespace?: string
  adminPortalSelector?: string
}

export const BetterEditorConfigProvider: React.FC<BetterEditorConfigProviderProps> = ({
  children,
  storageNamespace,
  adminPortalSelector,
}) => {
  const value = useMemo<BetterEditorRuntimeConfig>(
    () => ({
      storageKeys: storageNamespace ? buildStorageKeys(storageNamespace) : DEFAULT_STORAGE_KEYS,
      storageNamespace: storageNamespace ?? DEFAULT_STORAGE_NAMESPACE,
      adminPortalSelector,
    }),
    [storageNamespace, adminPortalSelector],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
