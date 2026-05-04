export const readNumber = (key: string, fallback: number, clamp?: (n: number) => number): number => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw == null ? NaN : Number(raw)
    if (!Number.isFinite(parsed)) return fallback
    return clamp ? clamp(parsed) : parsed
  } catch {
    return fallback
  }
}

export const writeString = (key: string, value: string): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // storage unavailable / quota exceeded
  }
}
