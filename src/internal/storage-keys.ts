export const DEFAULT_STORAGE_NAMESPACE = 'better-editor'

export type StorageKeys = {
  sidebarWidth: string
  responsiveWidth: string
  togglePreference: (collectionSlug?: string, globalSlug?: string) => string
}

export const buildStorageKeys = (namespace: string = DEFAULT_STORAGE_NAMESPACE): StorageKeys => ({
  sidebarWidth: `${namespace}:sidebar-width`,
  responsiveWidth: `${namespace}:responsive-width`,
  togglePreference: (collectionSlug, globalSlug) =>
    `${namespace}:${collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug ?? 'unknown'}`}`,
})

export const DEFAULT_STORAGE_KEYS = buildStorageKeys()
