export const STORAGE_SIDEBAR_WIDTH = 'better-editor:sidebar-width'
export const STORAGE_RESPONSIVE_WIDTH = 'better-editor:responsive-width'

export const togglePreferenceKey = (collectionSlug?: string, globalSlug?: string): string =>
  `better-editor:${collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug ?? 'unknown'}`}`

export const BLOCK_ID_ATTR = 'data-better-editor-id'
export const BLOCK_ID_SELECTOR = `[${BLOCK_ID_ATTR}]`
export const ACTIVE_CLASS = 'better-editor-active'
export const ACTIVE_SELECTOR = `.${ACTIVE_CLASS}`

export const VIEWPORT_MIN = 240
export const VIEWPORT_MAX = 2400

export const clampViewport = (n: number): number =>
  Math.min(VIEWPORT_MAX, Math.max(VIEWPORT_MIN, n))
