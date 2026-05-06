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
