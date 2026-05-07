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

export const BETTER_EDITOR_SETTINGS_SLUG = 'better-editor-settings'

// Mirrors the runtime regex in `preview/hover-css.ts` so the admin UI rejects
// values that would silently be skipped at render time.
const HOVER_COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^rgba?\(/i

const validateHoverColor = (value: unknown): string | true => {
  if (typeof value !== 'string' || value.length === 0) return 'Color is required'
  if (!HOVER_COLOR_RE.test(value.trim())) {
    return 'Must be a hex color (e.g. #3b82f6) or rgb()/rgba()'
  }
  return true
}

const validateHoverOutline = (value: unknown): string | true => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Must be a number'
  if (value < HOVER_OUTLINE_MIN || value > HOVER_OUTLINE_MAX) {
    return `Must be between ${HOVER_OUTLINE_MIN} and ${HOVER_OUTLINE_MAX}`
  }
  return true
}

export const betterEditorSettingsGlobal: GlobalConfig = {
  slug: BETTER_EDITOR_SETTINGS_SLUG,
  label: 'Settings',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Better Editor',
    description: 'Editor-wide preferences for the Better Editor overlay.',
  },

  fields: [
    {
      name: 'betterEditorSettingsBanner',
      type: 'ui',
      admin: {
        components: {
          Field: 'payload-better-editor/client#SettingsBanner',
        },
        // Hidden when the user opts out via `hideSettingsBanner`.
        condition: (_, siblingData) => !siblingData?.hideSettingsBanner,
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Sidebar',
          description: 'Where the sidebar sits and how its fields are stacked.',
          fields: [
            {
              name: 'sidebarPosition',
              type: 'select',
              label: 'Position',
              defaultValue: D.sidebarPosition,
              options: [
                { label: 'Right', value: 'right' },
                { label: 'Left', value: 'left' },
              ],
            },
            {
              name: 'forceFullWidthFields',
              type: 'checkbox',
              label: 'Stack fields full-width',
              defaultValue: D.forceFullWidthFields,
              admin: {
                description:
                  'Override admin.width on sidebar fields so they always span the full row.',
              },
            },
          ],
        },
        {
          label: 'Viewport',
          description: 'Pixel widths for the Tablet and Mobile preview modes.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tabletWidth',
                  type: 'number',
                  label: 'Tablet (px)',
                  defaultValue: D.tabletWidth,
                  min: TABLET_WIDTH_MIN,
                  max: TABLET_WIDTH_MAX,
                  admin: { width: '50%', placeholder: String(D.tabletWidth) },
                },
                {
                  name: 'mobileWidth',
                  type: 'number',
                  label: 'Mobile (px)',
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
          label: 'Outline',
          description: 'Outline + tint shown on the hovered block.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'hoverColorTopLevel',
                  type: 'text',
                  label: 'Top-level color',
                  defaultValue: D.hoverColorTopLevel,
                  validate: validateHoverColor,
                  admin: {
                    width: '50%',
                    placeholder: D.hoverColorTopLevel,
                    description: 'Hex color (e.g. `#3b82f6`).',
                  },
                },
                {
                  name: 'hoverColorNested',
                  type: 'text',
                  label: 'Nested color',
                  defaultValue: D.hoverColorNested,
                  validate: validateHoverColor,
                  admin: {
                    width: '50%',
                    placeholder: D.hoverColorNested,
                    description: 'Hex color for blocks nested inside another block.',
                  },
                },
              ],
            },
            {
              name: 'hoverOutlineWidth',
              type: 'number',
              label: 'Outline width (px)',
              defaultValue: D.hoverOutlineWidth,
              min: HOVER_OUTLINE_MIN,
              max: HOVER_OUTLINE_MAX,
              validate: validateHoverOutline,
              admin: {
                placeholder: String(D.hoverOutlineWidth),
                description: `Outline thickness in pixels (${HOVER_OUTLINE_MIN}–${HOVER_OUTLINE_MAX}).`,
              },
            },
          ],
        },
        {
          label: 'Toolbar',
          description:
            'Floating Move / Duplicate / Delete toolbar that appears on the hovered block.',
          fields: [
            {
              name: 'showHoverToolbar',
              type: 'checkbox',
              label: 'Enabled',
              defaultValue: D.showHoverToolbar,
            },
            {
              name: 'hoverToolbarPosition',
              type: 'select',
              label: 'Anchor corner',
              defaultValue: D.hoverToolbarPosition,
              options: [
                { label: 'Top right', value: 'top-right' },
                { label: 'Top left', value: 'top-left' },
                { label: 'Bottom right', value: 'bottom-right' },
                { label: 'Bottom left', value: 'bottom-left' },
              ],
            },
          ],
        },
        {
          label: 'Admin UI',
          description: 'Display preferences for this admin settings page.',
          fields: [
            {
              name: 'hideSettingsBanner',
              type: 'checkbox',
              label: 'Hide info banner',
              defaultValue: false,
              admin: {
                description:
                  "Don't show the project info / support card above the settings tabs.",
              },
            },
          ],
        },
      ],
    },
  ],
}
