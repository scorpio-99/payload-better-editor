export type SplitFieldPath = { parent: string; index: number } | null

export const splitFieldPath = (path: string): SplitFieldPath => {
  const lastDot = path.lastIndexOf('.')
  if (lastDot < 0) return null
  const tail = path.slice(lastDot + 1)
  // Form-state segments are non-negative integers; reject "", "1.5", "abc".
  if (!/^\d+$/.test(tail)) return null
  return { parent: path.slice(0, lastDot), index: Number(tail) }
}
