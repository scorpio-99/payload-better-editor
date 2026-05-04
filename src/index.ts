import type { Config } from 'payload'
import type { BetterEditorConfig } from './types'
import { betterEditorSettingsGlobal } from './global'

export type { BetterEditorConfig }
export { BETTER_EDITOR_SETTINGS_SLUG } from './global'

const DEFAULT_BLOCKS_FIELD = 'layout'
const TOGGLE_COMPONENT_PATH = 'payload-better-editor/client#LiveEditorToggle'

export const betterEditor =
  (pluginOptions?: BetterEditorConfig) =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) return config

    const enabledSlugs = new Set(pluginOptions?.collections ?? [])
    const blocksField = pluginOptions?.blocksField || DEFAULT_BLOCKS_FIELD

    const existingGlobals = config.globals ?? []
    config.globals = existingGlobals.some((g) => g.slug === betterEditorSettingsGlobal.slug)
      ? existingGlobals
      : [...existingGlobals, betterEditorSettingsGlobal]

    if (enabledSlugs.size === 0 || !config.collections) return config

    config.collections = config.collections.map((collection) => {
      if (!enabledSlugs.has(collection.slug)) return collection

      const admin = { ...(collection.admin ?? {}) }
      const components = { ...(admin.components ?? {}) }
      const edit = { ...(components.edit ?? {}) }

      return {
        ...collection,
        admin: {
          ...admin,
          components: {
            ...components,
            edit: {
              ...edit,
              beforeDocumentControls: [
                ...(edit.beforeDocumentControls ?? []),
                {
                  path: TOGGLE_COMPONENT_PATH,
                  clientProps: { blocksField },
                },
              ],
            },
          },
        },
      }
    })

    return config
  }
