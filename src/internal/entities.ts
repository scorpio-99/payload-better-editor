/** Normalizes the `collections`/`globals` plugin option (a slug list OR a
 * slug → options record) into a slug → blocksField map, applying the default
 * where unset. */
export const normalizeEntities = (
  option: string[] | Partial<Record<string, { blocksField?: string }>> | undefined,
  defaultBlocksField: string,
): Map<string, string> => {
  const map = new Map<string, string>()
  if (Array.isArray(option)) {
    for (const slug of option) map.set(slug, defaultBlocksField)
  } else if (option) {
    for (const [slug, cfg] of Object.entries(option)) {
      map.set(slug, cfg?.blocksField || defaultBlocksField)
    }
  }
  return map
}
