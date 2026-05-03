export type SplitFieldPath = { parent: string; index: number } | null

export const splitFieldPath = (path: string): SplitFieldPath => {
  const lastDot = path.lastIndexOf('.')
  if (lastDot < 0) return null
  const index = Number(path.slice(lastDot + 1))
  if (Number.isNaN(index)) return null
  return { parent: path.slice(0, lastDot), index }
}
