import type { Config } from 'payload'
import type { BetterEditorConfig } from './types'
import { betterEditorSettingsGlobal } from './global'

export type { BetterEditorConfig }
export { BETTER_EDITOR_SETTINGS_SLUG } from './global'

const DEFAULT_BLOCKS_FIELD = 'layout'

export const betterEditor =
  (pluginOptions?: BetterEditorConfig) =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) {
      return config
    }

    const enabledSlugs = new Set(pluginOptions?.collections || [])
    const blocksField = pluginOptions?.blocksField || DEFAULT_BLOCKS_FIELD

    config.globals = config.globals || []
    if (!config.globals.some((g) => g.slug === betterEditorSettingsGlobal.slug)) {
      config.globals.push(betterEditorSettingsGlobal)
    }

    if (enabledSlugs.size > 0 && config.collections) {
      config.collections = config.collections.map((collection) => {
        if (!enabledSlugs.has(collection.slug)) {
          return collection
        }

        const admin = { ...(collection.admin || {}) }
        const components = { ...(admin.components || {}) }
        const edit = { ...(components.edit || {}) }

        const beforeDocumentControls = [
          ...(edit.beforeDocumentControls || []),
          {
            path: 'payload-better-editor/client#LiveEditorToggle',
            clientProps: {
              blocksField,
            },
          },
        ]

        return {
          ...collection,
          admin: {
            ...admin,
            components: {
              ...components,
              edit: {
                ...edit,
                beforeDocumentControls,
              },
            },
          },
        }
      })
    }

    return config
  }
