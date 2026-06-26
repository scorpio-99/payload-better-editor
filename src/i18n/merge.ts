import type { BetterEditorTranslations } from './types'

export const deepMerge = (
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    const ov = override[key]
    const bv = base[key]
    if (
      ov !== null && typeof ov === 'object' && !Array.isArray(ov) &&
      bv !== null && typeof bv === 'object' && !Array.isArray(bv)
    ) {
      result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>)
    } else if (ov !== undefined) {
      result[key] = ov
    }
  }
  return result
}

/**
 * Merges user-supplied `betterEditor` translations from `existing` locale object
 * on top of the plugin's built-in translations, so individual keys can be
 * overridden without replacing the whole object.
 */
export const mergeTranslations = (
  builtin: BetterEditorTranslations,
  existing: unknown,
): BetterEditorTranslations =>
  deepMerge(
    builtin as unknown as Record<string, unknown>,
    ((existing as Record<string, unknown>)?.betterEditor as Record<string, unknown>) ?? {},
  ) as unknown as BetterEditorTranslations
