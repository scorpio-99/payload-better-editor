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

// Sidebar dimensions (px). Used by the runtime resize hook + the settings
// global's input limits.
export const DEFAULT_SIDEBAR_WIDTH = 400
export const MIN_SIDEBAR_WIDTH = 250
export const MAX_SIDEBAR_WIDTH = 800

// Responsive viewport mode default width (px). Initial value when the user
// switches into "responsive" before they drag the handles.
export const DEFAULT_RESPONSIVE_WIDTH = 1024

// Sidebar resize-handle keyboard nudges (px per keystroke).
export const SIDEBAR_KEYBOARD_STEP_PX = 16
export const SIDEBAR_KEYBOARD_STEP_LARGE_PX = 64

// Debounce window for persisting transient UI state to localStorage.
// Drags fire 60×/s and keyboard nudges fire per keystroke; we only want
// the final value written.
export const STORAGE_DEBOUNCE_MS = 250
