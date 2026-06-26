import type { CollectionConfig, Config, Field, GlobalConfig } from 'payload'
import type { BetterEditorConfig } from './types'
import { BETTER_EDITOR_SETTINGS_BANNER_FIELD, betterEditorSettingsGlobal } from './global'
import { normalizeEntities } from './internal/entities'
import { en } from './i18n/en'
import { de } from './i18n/de'
import { mergeTranslations } from './i18n/merge'

export type { BetterEditorConfig }
export type { BetterEditorSettings, HoverToolbarPosition } from './state/useBetterEditorSettings'
export type { SidebarPosition } from './internal/constants'
export type { BetterEditorTranslations } from './i18n/types'
export { BETTER_EDITOR_SETTINGS_SLUG } from './global'

/** Plugin signature — handy for typing plugin lists in consumer code. */
export type BetterEditorPlugin = (config: Config) => Config


export { VERSION } from './version'

const DEFAULT_BLOCKS_FIELD = 'layout'
const TOGGLE_COMPONENT_PATH = 'payload-better-editor/client#LiveEditorToggle'
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Checks whether a field with the given `name` exists at the document's
 * top-level data path. Recurses into presentational containers that do
 * not introduce a path segment (`tabs` without a name, `row`, `collapsible`)
 * but stops at `group` and named tabs, since those namespace their children.
 */
const hasBlocksField = (fields: Field[] | undefined, name: string): boolean => {
  if (!Array.isArray(fields)) return false
  return fields.some((field) => {
    if ('name' in field && field.name === name) return true
    if (field.type === 'row' || field.type === 'collapsible') {
      return hasBlocksField(field.fields, name)
    }
    if (field.type === 'tabs') {
      return field.tabs.some((tab) =>
        'name' in tab && tab.name ? false : hasBlocksField(tab.fields, name),
      )
    }
    return false
  })
}

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

/**
 * Payload CMS plugin factory for the Better Editor overlay. Adds an
 * "Open Better Editor" toggle to the configured collections / globals
 * and registers a `BetterEditorSettings` global with editor-wide options.
 *
 * @example
 *   import { betterEditor } from 'payload-better-editor'
 *
 *   export default buildConfig({
 *     plugins: [betterEditor({ collections: ['pages'] })],
 *     // ...
 *   })
 *
 * @see {@link BetterEditorConfig} for all options.
 */
export const betterEditor =
  (pluginOptions?: BetterEditorConfig): BetterEditorPlugin =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) return config

    const defaultBlocksField = pluginOptions?.blocksField || DEFAULT_BLOCKS_FIELD
    const collectionMap = normalizeEntities(pluginOptions?.collections, defaultBlocksField)
    const globalMap = normalizeEntities(pluginOptions?.globals, defaultBlocksField)
    const toggleClientProps = (blocksField: string): ToggleClientProps => ({
      blocksField,
      adminPortalSelector: pluginOptions?.adminPortalSelector,
      storageNamespace: pluginOptions?.storageNamespace,
    })

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

    const existingTranslations = config.i18n?.translations ?? {}
    config.i18n = {
      ...config.i18n,
      translations: {
        ...existingTranslations,
        en: {
          ...(existingTranslations.en as object ?? {}),
          betterEditor: mergeTranslations(en, existingTranslations.en),
        },
        de: {
          ...(existingTranslations.de as object ?? {}),
          betterEditor: mergeTranslations(de, existingTranslations.de),
        },
      },
    }

    if (collectionMap.size === 0 && globalMap.size === 0) {
      if (isDev) {

        console.warn(
          '[better-editor] plugin loaded with empty `collections` and `globals` — toggle button will not appear anywhere. Pass `collections: ["pages"]` (or similar) to BetterEditorConfig.',
        )
      }
      return config
    }

    if (collectionMap.size > 0 && config.collections) {
      config.collections = config.collections.map((collection) => {
        const blocksField = collectionMap.get(collection.slug)
        if (blocksField === undefined) return collection
        if (isDev && !hasBlocksField(collection.fields, blocksField)) {
          warnMissingBlocksField('collection', collection.slug, blocksField)
        }
        return withToggleInjected(collection, 'edit', toggleClientProps(blocksField))
      })
    }

    if (globalMap.size > 0) {
      config.globals = (config.globals ?? []).map((global) => {
        const blocksField = globalMap.get(global.slug)
        if (blocksField === undefined) return global
        if (isDev && !hasBlocksField(global.fields, blocksField)) {
          warnMissingBlocksField('global', global.slug, blocksField)
        }
        return withToggleInjected(global, 'elements', toggleClientProps(blocksField))
      })
    }

    return config
  }
