export const STORAGE_SIDEBAR_WIDTH = 'better-editor:sidebar-width'
export const STORAGE_RESPONSIVE_WIDTH = 'better-editor:responsive-width'

export const togglePreferenceKey = (collectionSlug?: string, globalSlug?: string): string =>
  `better-editor:${collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug ?? 'unknown'}`}`
