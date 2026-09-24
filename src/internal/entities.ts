export type NormalizedEntity = {
  blocksField: string
  defaultOpen: boolean
}

/** Normalizes the `collections`/`globals` plugin option (a slug list OR a
 * slug → options record) into a slug → options map, applying the defaults
 * where unset. */
export const normalizeEntities = (
  option:
    | string[]
    | Partial<Record<string, { blocksField?: string; defaultOpen?: boolean }>>
    | undefined,
  defaultBlocksField: string,
): Map<string, NormalizedEntity> => {
  const map = new Map<string, NormalizedEntity>()
  if (Array.isArray(option)) {
    for (const slug of option) {
      map.set(slug, { blocksField: defaultBlocksField, defaultOpen: false })
    }
  } else if (option) {
    for (const [slug, cfg] of Object.entries(option)) {
      map.set(slug, {
        blocksField: cfg?.blocksField || defaultBlocksField,
        defaultOpen: cfg?.defaultOpen === true,
      })
    }
  }
  return map
}
