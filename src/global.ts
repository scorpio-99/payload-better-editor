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
          ],
        },
      ],
    },
  ],
}
