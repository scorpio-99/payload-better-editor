import type { GlobalConfig } from 'payload'

export const BETTER_EDITOR_SETTINGS_SLUG = 'better-editor-settings'

export const betterEditorSettingsGlobal: GlobalConfig = {
  slug: BETTER_EDITOR_SETTINGS_SLUG,
  label: 'Better Editor',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layout',
          fields: [
            {
              name: 'sidebarPosition',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Right', value: 'right' },
                { label: 'Left', value: 'left' },
              ],
            },
            {
              name: 'forceFullWidthFields',
              type: 'checkbox',
              defaultValue: true,
              label: 'Force full-width fields in sidebar',
              admin: {
                description:
                  'Stack all sidebar fields vertically by overriding their admin.width. Disable to respect the field config (e.g. four 25%-wide selects on a single row).',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'tabletWidth',
                  type: 'number',
                  defaultValue: 800,
                  min: 320,
                  max: 1600,
                  admin: {
                    width: '50%',
                    placeholder: '800',
                    description: 'Width in pixels for the Tablet preview viewport.',
                  },
                },
                {
                  name: 'mobileWidth',
                  type: 'number',
                  defaultValue: 400,
                  min: 240,
                  max: 800,
                  admin: {
                    width: '50%',
                    placeholder: '400',
                    description: 'Width in pixels for the Mobile preview viewport.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Hover',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'hoverColorTopLevel',
                  type: 'text',
                  defaultValue: '#3b82f6',
                  label: 'Top-Level Hover Color',
                  admin: {
                    width: '50%',
                    description: 'Hex color for top-level block outline.',
                  },
                },
                {
                  name: 'hoverColorNested',
                  type: 'text',
                  defaultValue: '#f59e0b',
                  label: 'Nested Hover Color',
                  admin: {
                    width: '50%',
                    description: 'Hex color for nested block outline.',
                  },
                },
              ],
            },
            {
              name: 'hoverOutlineWidth',
              type: 'number',
              defaultValue: 2,
              min: 1,
              max: 5,
              admin: {
                description: 'Hover outline width in pixels (1–5).',
              },
            },
            {
              name: 'showHoverToolbar',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show hover toolbar in preview',
              admin: {
                description:
                  'Floating toolbar with Move / Duplicate / Delete buttons that appears on the hovered block. Disable if you prefer working only via the sidebar.',
              },
            },
            {
              name: 'hoverToolbarPosition',
              type: 'select',
              defaultValue: 'top-right',
              options: [
                { label: 'Top right', value: 'top-right' },
                { label: 'Top left', value: 'top-left' },
                { label: 'Bottom right', value: 'bottom-right' },
                { label: 'Bottom left', value: 'bottom-left' },
              ],
              admin: {
                description: 'Anchor corner for the hover toolbar.',
              },
            },
          ],
        },
      ],
    },
  ],
}
