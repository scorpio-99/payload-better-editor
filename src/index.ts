import type { CollectionConfig, Config, Field, GlobalConfig } from 'payload'
import type { BetterEditorConfig } from './types'
import { BETTER_EDITOR_SETTINGS_BANNER_FIELD, betterEditorSettingsGlobal } from './global'

export type { BetterEditorConfig }
export type { BetterEditorSettings, HoverToolbarPosition } from './state/useBetterEditorSettings'
export { BETTER_EDITOR_SETTINGS_SLUG } from './global'

/** Plugin signature — handy for typing plugin lists in consumer code. */
export type BetterEditorPlugin = (config: Config) => Config

export { VERSION } from './version'

const DEFAULT_BLOCKS_FIELD = 'layout'
const TOGGLE_COMPONENT_PATH = 'payload-better-editor/client#LiveEditorToggle'
const isDev = process.env.NODE_ENV !== 'production'

const hasBlocksField = (fields: Field[] | undefined, name: string): boolean =>
  Array.isArray(fields) && fields.some((f) => 'name' in f && f.name === name)

type ToggleSlot = 'edit' | 'elements'

type ToggleClientProps = {
  blocksField: string
  adminPortalSelector?: string
  storageNamespace?: string
}

const withToggleInjected = <T extends CollectionConfig | GlobalConfig>(
  entity: T,
  slot: ToggleSlot,
  clientProps: ToggleClientProps,
): T => {
  const admin = { ...(entity.admin ?? {}) } as NonNullable<T['admin']>
  const components = { ...(admin.components ?? {}) } as Record<string, unknown>
  const target = { ...((components[slot] as Record<string, unknown>) ?? {}) }
  const before = (target.beforeDocumentControls as unknown[]) ?? []
  return {
    ...entity,
    admin: {
      ...admin,
      components: {
        ...components,
        [slot]: {
          ...target,
          beforeDocumentControls: [
            ...before,
            { path: TOGGLE_COMPONENT_PATH, clientProps },
          ],
        },
      },
    },
  }
}

const warnMissingBlocksField = (kind: 'collection' | 'global', slug: string, blocksField: string) => {

  console.warn(
    `[better-editor] ${kind} "${slug}" has no top-level field named "${blocksField}" — the sidebar Blocks tab will be empty. Set \`blocksField\` to the actual blocks field name.`,
  )
}

export const betterEditor =
  (pluginOptions?: BetterEditorConfig): BetterEditorPlugin =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) return config

    const collectionSlugs = new Set(pluginOptions?.collections ?? [])
    const globalSlugs = new Set(pluginOptions?.globals ?? [])
    const blocksField = pluginOptions?.blocksField || DEFAULT_BLOCKS_FIELD
    const clientProps: ToggleClientProps = {
      blocksField,
      adminPortalSelector: pluginOptions?.adminPortalSelector,
      storageNamespace: pluginOptions?.storageNamespace,
    }

    const showBanner = pluginOptions?.showSettingsBanner !== false
    const settingsGlobal: GlobalConfig = showBanner
      ? betterEditorSettingsGlobal
      : {
          ...betterEditorSettingsGlobal,
          fields: betterEditorSettingsGlobal.fields.filter(
            (f) => !('name' in f && f.name === BETTER_EDITOR_SETTINGS_BANNER_FIELD),
          ),
        }

    const existingGlobals = config.globals ?? []
    const hasSettingsGlobal = existingGlobals.some((g) => g.slug === settingsGlobal.slug)
    config.globals = hasSettingsGlobal
      ? existingGlobals
      : [...existingGlobals, settingsGlobal]

    if (collectionSlugs.size === 0 && globalSlugs.size === 0) {
      if (isDev) {

        console.warn(
          '[better-editor] plugin loaded with empty `collections` and `globals` — toggle button will not appear anywhere. Pass `collections: ["pages"]` (or similar) to BetterEditorConfig.',
        )
      }
      return config
    }

    if (collectionSlugs.size > 0 && config.collections) {
      config.collections = config.collections.map((collection) => {
        if (!collectionSlugs.has(collection.slug)) return collection
        if (isDev && !hasBlocksField(collection.fields, blocksField)) {
          warnMissingBlocksField('collection', collection.slug, blocksField)
        }
        return withToggleInjected(collection, 'edit', clientProps)
      })
    }

    if (globalSlugs.size > 0) {
      config.globals = (config.globals ?? []).map((global) => {
        if (!globalSlugs.has(global.slug)) return global
        if (isDev && !hasBlocksField(global.fields, blocksField)) {
          warnMissingBlocksField('global', global.slug, blocksField)
        }
        return withToggleInjected(global, 'elements', clientProps)
      })
    }

    return config
  }
