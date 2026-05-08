import type { HoverToolbarPosition } from '../internal/constants'

// Mirrors the 1px outline-edge gap in HOVER_CSS so the toolbar stays a
// consistent visual distance from the outline regardless of outline width.
const OUTLINE_EDGE_GAP = 1
// Visual breathing room between the outline's inner edge and the toolbar.
const TOOLBAR_BREATHING_ROOM = 3

export type ToolbarRect = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>
export type ToolbarSize = { width: number; height: number }
export type ScrollOffset = { scrollX: number; scrollY: number }

export type ToolbarCoords = { top: number; left: number }

/**
 * Pure layout math: places a toolbar in one of the 4 corners of a target
 * rect, inset by the outline + a breathing-room gap. Decoupled from the
 * DOM so it stays testable.
 */
export const calculateToolbarPosition = (
  rect: ToolbarRect,
  size: ToolbarSize,
  scroll: ScrollOffset,
  position: HoverToolbarPosition,
  outlineWidth: number,
): ToolbarCoords => {
  const inset = OUTLINE_EDGE_GAP + outlineWidth + TOOLBAR_BREATHING_ROOM
  const isTop = position.startsWith('top')
  const isRight = position.endsWith('right')
  const top = isTop
    ? scroll.scrollY + rect.top + inset
    : scroll.scrollY + rect.bottom - size.height - inset
  const left = isRight
    ? scroll.scrollX + rect.right - size.width - inset
    : scroll.scrollX + rect.left + inset
  return { top, left }
}
