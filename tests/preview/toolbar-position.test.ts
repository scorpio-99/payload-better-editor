import { describe, expect, it } from 'vitest'
import { calculateToolbarPosition, type ToolbarRect } from '../../src/preview/toolbar-position'

const RECT: ToolbarRect = { top: 100, bottom: 300, left: 200, right: 600 }
const SIZE = { width: 120, height: 32 }
const SCROLL = { scrollX: 0, scrollY: 0 }
const OUTLINE = 2 // inset = 1 + 2 + 3 = 6

describe('calculateToolbarPosition', () => {
  it('places the toolbar in the top-right corner of the rect', () => {
    const { top, left } = calculateToolbarPosition(RECT, SIZE, SCROLL, 'top-right', OUTLINE)
    expect(top).toBe(100 + 6) // rect.top + inset
    expect(left).toBe(600 - 120 - 6) // rect.right - tbWidth - inset
  })

  it('places the toolbar in the top-left corner of the rect', () => {
    const { top, left } = calculateToolbarPosition(RECT, SIZE, SCROLL, 'top-left', OUTLINE)
    expect(top).toBe(100 + 6)
    expect(left).toBe(200 + 6) // rect.left + inset
  })

  it('places the toolbar in the bottom-right corner of the rect', () => {
    const { top, left } = calculateToolbarPosition(RECT, SIZE, SCROLL, 'bottom-right', OUTLINE)
    expect(top).toBe(300 - 32 - 6) // rect.bottom - tbHeight - inset
    expect(left).toBe(600 - 120 - 6)
  })

  it('places the toolbar in the bottom-left corner of the rect', () => {
    const { top, left } = calculateToolbarPosition(RECT, SIZE, SCROLL, 'bottom-left', OUTLINE)
    expect(top).toBe(300 - 32 - 6)
    expect(left).toBe(200 + 6)
  })

  it('adds the scroll offset to the document-relative position', () => {
    const scroll = { scrollX: 50, scrollY: 1000 }
    const { top, left } = calculateToolbarPosition(RECT, SIZE, scroll, 'top-right', OUTLINE)
    expect(top).toBe(1000 + 100 + 6)
    expect(left).toBe(50 + 600 - 120 - 6)
  })

  it('reflects outline width changes in the inset', () => {
    const wide = calculateToolbarPosition(RECT, SIZE, SCROLL, 'top-right', 10)
    // inset = 1 + 10 + 3 = 14
    expect(wide.top).toBe(100 + 14)
    expect(wide.left).toBe(600 - 120 - 14)
  })
})
