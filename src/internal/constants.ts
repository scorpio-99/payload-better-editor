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
