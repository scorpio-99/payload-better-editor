import type { Config, Field } from 'payload'
import type { BetterEditorConfig } from './types'
import { betterEditorSettingsGlobal } from './global'

export type { BetterEditorConfig }
export type { BetterEditorSettings, HoverToolbarPosition } from './useBetterEditorSettings'
export { BETTER_EDITOR_SETTINGS_SLUG } from './global'

/** Plugin signature — handy for typing plugin lists in consumer code. */
export type BetterEditorPlugin = (config: Config) => Config

/** Plugin version (matches package.json). Useful for telemetry. */
export const VERSION = '1.0.0'

const DEFAULT_BLOCKS_FIELD = 'layout'
const TOGGLE_COMPONENT_PATH = 'payload-better-editor/client#LiveEditorToggle'
const isDev = process.env.NODE_ENV !== 'production'

// Field unions include presentational/grouping nodes (rows, tabs, ui, …)
// without `name`. Cheap top-level scan: only counts as "found" when a
// named field's `name` equals the configured blocks field. Nested paths
// like `content.layout` are out of scope for the v1 sidebar wiring.
const hasTopLevelField = (fields: Field[] | undefined, name: string): boolean =>
  Array.isArray(fields) && fields.some((f) => 'name' in f && f.name === name)

export const betterEditor =
  (pluginOptions?: BetterEditorConfig): BetterEditorPlugin =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) return config

    const enabledCollectionSlugs = new Set(pluginOptions?.collections ?? [])
    const enabledGlobalSlugs = new Set(pluginOptions?.globals ?? [])
    const blocksField = pluginOptions?.blocksField || DEFAULT_BLOCKS_FIELD

    const existingGlobals = config.globals ?? []
    config.globals = existingGlobals.some((g) => g.slug === betterEditorSettingsGlobal.slug)
      ? existingGlobals
      : [...existingGlobals, betterEditorSettingsGlobal]

    if (enabledCollectionSlugs.size === 0 && enabledGlobalSlugs.size === 0) {
      if (isDev) {
         
        console.warn(
          '[better-editor] plugin loaded with empty `collections` and `globals` — toggle button will not appear anywhere. Pass `collections: ["pages"]` (or similar) to BetterEditorConfig.',
        )
      }
      return config
    }

    if (enabledCollectionSlugs.size > 0 && config.collections) {
      config.collections = config.collections.map((collection) => {
        if (!enabledCollectionSlugs.has(collection.slug)) return collection

        if (isDev && !hasTopLevelField(collection.fields, blocksField)) {
           
          console.warn(
            `[better-editor] collection "${collection.slug}" has no top-level field named "${blocksField}" — the sidebar Blocks tab will be empty. Set \`blocksField\` to the actual blocks field name.`,
          )
        }

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
    }

    if (enabledGlobalSlugs.size > 0) {
      config.globals = (config.globals ?? []).map((global) => {
        if (!enabledGlobalSlugs.has(global.slug)) return global

        if (isDev && !hasTopLevelField(global.fields, blocksField)) {
           
          console.warn(
            `[better-editor] global "${global.slug}" has no top-level field named "${blocksField}" — the sidebar Blocks tab will be empty. Set \`blocksField\` to the actual blocks field name.`,
          )
        }

        const admin = { ...(global.admin ?? {}) }
        const components = { ...(admin.components ?? {}) }
        const elements = { ...(components.elements ?? {}) }

        return {
          ...global,
          admin: {
            ...admin,
            components: {
              ...components,
              elements: {
                ...elements,
                beforeDocumentControls: [
                  ...(elements.beforeDocumentControls ?? []),
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
    }

    return config
  }
