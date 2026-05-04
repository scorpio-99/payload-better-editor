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

export const TABLET_WIDTH_MIN = 320
export const TABLET_WIDTH_MAX = 1600
export const MOBILE_WIDTH_MIN = 240
export const MOBILE_WIDTH_MAX = 800
export const HOVER_OUTLINE_MIN = 1
export const HOVER_OUTLINE_MAX = 5

export const SIDEBAR_POSITIONS = ['left', 'right'] as const
export type SidebarPosition = (typeof SIDEBAR_POSITIONS)[number]

export const HOVER_TOOLBAR_POSITIONS = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
] as const
export type HoverToolbarPosition = (typeof HOVER_TOOLBAR_POSITIONS)[number]

export const DEFAULT_BETTER_EDITOR_SETTINGS = {
  sidebarPosition: 'right' as SidebarPosition,
  forceFullWidthFields: true,
  tabletWidth: 800,
  mobileWidth: 400,
  hoverColorTopLevel: '#3b82f6',
  hoverColorNested: '#f59e0b',
  hoverOutlineWidth: 2,
  showHoverToolbar: true,
  hoverToolbarPosition: 'top-right' as HoverToolbarPosition,
} as const
