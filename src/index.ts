import type { Config } from 'payload'
import type { BetterEditorConfig } from './types'

export type { BetterEditorConfig }

const DEFAULT_BLOCKS_FIELD = 'layout'
const DEFAULT_SELECTOR = '[data-better-editor-blocks] > *'

export const betterEditor =
  (pluginOptions?: BetterEditorConfig) =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) {
      return config
    }

    const enabledSlugs = new Set(pluginOptions?.collections || [])
    const blocksField = pluginOptions?.blocksField || DEFAULT_BLOCKS_FIELD
    const topLevelBlocksSelector =
      pluginOptions?.topLevelBlocksSelector || DEFAULT_SELECTOR

    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    config.admin.components.providers = config.admin.components.providers || []
    config.admin.components.providers.push({
      path: 'payload-better-editor/client#BetterEditorProvider',
      clientProps: {},
    })

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
              topLevelBlocksSelector,
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
