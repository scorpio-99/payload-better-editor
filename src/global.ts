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
    description: 'Editor-wide preferences for the Better Editor overlay.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // --- Sidebar -------------------------------------------------------
        {
          label: 'Sidebar',
          description: 'Where the sidebar sits and how its fields are stacked.',
          fields: [
            {
              name: 'sidebarPosition',
              type: 'select',
              label: 'Position',
              defaultValue: 'right',
              options: [
                { label: 'Right', value: 'right' },
                { label: 'Left', value: 'left' },
              ],
            },
            {
              name: 'forceFullWidthFields',
              type: 'checkbox',
              label: 'Stack fields full-width',
              defaultValue: true,
              admin: {
                description:
                  'Override admin.width on sidebar fields so they always span the full row.',
              },
            },
          ],
        },

        // --- Viewport ------------------------------------------------------
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
                  defaultValue: 800,
                  min: 320,
                  max: 1600,
                  admin: { width: '50%', placeholder: '800' },
                },
                {
                  name: 'mobileWidth',
                  type: 'number',
                  label: 'Mobile (px)',
                  defaultValue: 400,
                  min: 240,
                  max: 800,
                  admin: { width: '50%', placeholder: '400' },
                },
              ],
            },
          ],
        },

        // --- Outline -------------------------------------------------------
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
                  defaultValue: '#3b82f6',
                  admin: {
                    width: '50%',
                    placeholder: '#3b82f6',
                    description: 'Hex color (e.g. `#3b82f6`).',
                  },
                },
                {
                  name: 'hoverColorNested',
                  type: 'text',
                  label: 'Nested color',
                  defaultValue: '#f59e0b',
                  admin: {
                    width: '50%',
                    placeholder: '#f59e0b',
                    description: 'Hex color for blocks nested inside another block.',
                  },
                },
              ],
            },
            {
              name: 'hoverOutlineWidth',
              type: 'number',
              label: 'Outline width (px)',
              defaultValue: 2,
              min: 1,
              max: 5,
              admin: {
                placeholder: '2',
                description: 'Outline thickness in pixels (1–5).',
              },
            },
          ],
        },

        // --- Toolbar -------------------------------------------------------
        {
          label: 'Toolbar',
          description:
            'Floating Move / Duplicate / Delete toolbar that appears on the hovered block.',
          fields: [
            {
              name: 'showHoverToolbar',
              type: 'checkbox',
              label: 'Enabled',
              defaultValue: true,
            },
            {
              name: 'hoverToolbarPosition',
              type: 'select',
              label: 'Anchor corner',
              defaultValue: 'top-right',
              options: [
                { label: 'Top right', value: 'top-right' },
                { label: 'Top left', value: 'top-left' },
                { label: 'Bottom right', value: 'bottom-right' },
                { label: 'Bottom left', value: 'bottom-left' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
