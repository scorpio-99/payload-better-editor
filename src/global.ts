import type { GlobalConfig } from 'payload'
import { DEFAULT_BETTER_EDITOR_SETTINGS as D } from './internal/constants'
import {
  HOVER_OUTLINE_MAX,
  HOVER_OUTLINE_MIN,
  MOBILE_WIDTH_MAX,
  MOBILE_WIDTH_MIN,
  TABLET_WIDTH_MAX,
  TABLET_WIDTH_MIN,
} from './internal/limits'
import type { BetterEditorTranslations } from './i18n/types'
import { en } from './i18n/en'
import { de } from './i18n/de'

export const BETTER_EDITOR_SETTINGS_SLUG = 'better-editor-settings'

export const BETTER_EDITOR_SETTINGS_BANNER_FIELD = 'betterEditorSettingsBanner'

// Mirrors the runtime regex in `preview/hover-css.ts` so the admin UI rejects
// values that would silently be skipped at render time.
const HOVER_COLOR_RE = /^(?:#[0-9a-fA-F]{3,8}|rgba?\([^()\n\r]*\))$/i

// Payload's TFunction is strictly typed to known keys — cast to allow custom plugin keys.
type AnyT = (key: string) => string

const settingsKey = (path: string) => `betterEditor:settings.${path}`

// Locales the plugin ships built-in translations for.
const SETTINGS_TRANSLATIONS: Record<string, BetterEditorTranslations['settings']> = {
  en: en.settings,
  de: de.settings,
}

const lookupSetting = (settings: BetterEditorTranslations['settings'], path: string): string =>
  path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], settings) as string

// Entity/field labels and descriptions are serialized into the admin RootLayout
// (a Client Component), so they must be plain data — a function (e.g. `({ t }) => …`)
// can't cross that RSC boundary. Return a Payload locale map built from our bundled
// translations; Payload selects the entry for the admin UI language. (Runtime `t()`
// stays available for `validate`, which Payload strips before client serialization.)
const translatedLabel = (path: string): Record<string, string> =>
  Object.fromEntries(
    Object.entries(SETTINGS_TRANSLATIONS).map(([locale, settings]) => [locale, lookupSetting(settings, path)]),
  )

const validateHoverColor = (value: unknown, args: unknown): string | true => {
  const t: AnyT = (args as { t?: AnyT })?.t ?? ((k) => k)
  if (typeof value !== 'string' || value.length === 0) return t(settingsKey('validation.colorRequired'))
  if (!HOVER_COLOR_RE.test(value.trim())) return t(settingsKey('validation.colorInvalid'))
  return true
}

const validateHoverOutline = (value: unknown, args: unknown): string | true => {
  const t: AnyT = (args as { t?: AnyT })?.t ?? ((k) => k)
  if (typeof value !== 'number' || !Number.isFinite(value)) return t(settingsKey('validation.mustBeNumber'))
  if (value < HOVER_OUTLINE_MIN || value > HOVER_OUTLINE_MAX) return t(settingsKey('validation.outlineRange'))
  return true
}

export const betterEditorSettingsGlobal: GlobalConfig = {
  slug: BETTER_EDITOR_SETTINGS_SLUG,
  label: translatedLabel('globalLabel'),
  access: {
    read: () => true,
  },
  admin: {
    group: 'Better Editor',
    description: translatedLabel('globalDescription'),
  },

  fields: [
    {
      name: 'betterEditorSettingsBanner',
      type: 'ui',
      admin: {
        components: {
          Field: 'payload-better-editor/client#SettingsBanner',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: translatedLabel('sidebar.tabLabel'),
          description: translatedLabel('sidebar.tabDescription'),
          fields: [
            {
              name: 'sidebarPosition',
              type: 'select',
              label: translatedLabel('sidebar.position'),
              defaultValue: D.sidebarPosition,
              options: [
                { label: translatedLabel('sidebar.positionRight'), value: 'right' },
                { label: translatedLabel('sidebar.positionLeft'), value: 'left' },
              ],
            },
            {
              name: 'forceFullWidthFields',
              type: 'checkbox',
              label: translatedLabel('sidebar.forceFullWidth'),
              defaultValue: D.forceFullWidthFields,
              admin: {
                description: translatedLabel('sidebar.forceFullWidthDesc'),
              },
            },
          ],
        },
        {
          label: translatedLabel('viewport.tabLabel'),
          description: translatedLabel('viewport.tabDescription'),
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tabletWidth',
                  type: 'number',
                  label: translatedLabel('viewport.tabletWidth'),
                  defaultValue: D.tabletWidth,
                  min: TABLET_WIDTH_MIN,
                  max: TABLET_WIDTH_MAX,
                  admin: { width: '50%', placeholder: String(D.tabletWidth) },
                },
                {
                  name: 'mobileWidth',
                  type: 'number',
                  label: translatedLabel('viewport.mobileWidth'),
                  defaultValue: D.mobileWidth,
                  min: MOBILE_WIDTH_MIN,
                  max: MOBILE_WIDTH_MAX,
                  admin: { width: '50%', placeholder: String(D.mobileWidth) },
                },
              ],
            },
          ],
        },
        {
          label: translatedLabel('outline.tabLabel'),
          description: translatedLabel('outline.tabDescription'),
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'hoverColorTopLevel',
                  type: 'text',
                  label: translatedLabel('outline.topLevelColor'),
                  defaultValue: D.hoverColorTopLevel,
                  validate: validateHoverColor,
                  admin: {
                    width: '50%',
                    placeholder: D.hoverColorTopLevel,
                    description: translatedLabel('outline.topLevelColorDesc'),
                  },
                },
                {
                  name: 'hoverColorNested',
                  type: 'text',
                  label: translatedLabel('outline.nestedColor'),
                  defaultValue: D.hoverColorNested,
                  validate: validateHoverColor,
                  admin: {
                    width: '50%',
                    placeholder: D.hoverColorNested,
                    description: translatedLabel('outline.nestedColorDesc'),
                  },
                },
              ],
            },
            {
              name: 'hoverOutlineWidth',
              type: 'number',
              label: translatedLabel('outline.outlineWidth'),
              defaultValue: D.hoverOutlineWidth,
              min: HOVER_OUTLINE_MIN,
              max: HOVER_OUTLINE_MAX,
              validate: validateHoverOutline,
              admin: {
                placeholder: String(D.hoverOutlineWidth),
                description: translatedLabel('outline.outlineWidthDesc'),
              },
            },
          ],
        },
        {
          label: translatedLabel('toolbar.tabLabel'),
          description: translatedLabel('toolbar.tabDescription'),
          fields: [
            {
              name: 'showHoverToolbar',
              type: 'checkbox',
              label: translatedLabel('toolbar.enabled'),
              defaultValue: D.showHoverToolbar,
            },
            {
              name: 'hoverToolbarPosition',
              type: 'select',
              label: translatedLabel('toolbar.anchorCorner'),
              defaultValue: D.hoverToolbarPosition,
              options: [
                { label: translatedLabel('toolbar.topRight'), value: 'top-right' },
                { label: translatedLabel('toolbar.topLeft'), value: 'top-left' },
                { label: translatedLabel('toolbar.bottomRight'), value: 'bottom-right' },
                { label: translatedLabel('toolbar.bottomLeft'), value: 'bottom-left' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
