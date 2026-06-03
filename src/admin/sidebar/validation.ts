import type { FormState } from 'payload'

export type FieldError = {
  path: string
  label: string
  message: string
  /** Top-level block path to select on click, or null for non-block fields. */
  blockPath: string | null
}

const lastSegment = (path: string): string => {
  const parts = path.split('.')
  return parts[parts.length - 1] || path
}

// Top-level block (`layout.2`) a field path belongs to, or null if outside the blocks field.
export const toBlockPath = (fieldPath: string, blocksField: string): string | null => {
  if (!fieldPath.startsWith(`${blocksField}.`)) return null
  const index = fieldPath.slice(blocksField.length + 1).split('.')[0]
  return /^\d+$/.test(index) ? `${blocksField}.${index}` : null
}

// Require a message: leaf errors carry one, containers/groups don't — keeps
// spurious parent rows out.
export const collectFieldErrors = (fields: FormState, blocksField: string): FieldError[] => {
  const out: FieldError[] = []
  for (const [path, field] of Object.entries(fields)) {
    if (field.valid === false && typeof field.errorMessage === 'string') {
      out.push({
        path,
        label: lastSegment(path),
        message: field.errorMessage,
        blockPath: toBlockPath(path, blocksField),
      })
    }
  }
  return out
}
