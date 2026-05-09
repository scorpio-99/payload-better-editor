# payload-better-editor — Developer Guide
Full installation and configuration reference. For a feature overview see the [README](./README.md).

## Installation
```bash
pnpm add payload-better-editor
# or
npm install payload-better-editor
```

## Setup
### 1. Register the plugin
```ts
// payload.config.ts
import { betterEditor } from 'payload-better-editor'

export default buildConfig({
  plugins: [
    betterEditor({
      collections: ['pages'], // collection slugs where the toggle appears
    }),
  ],
  admin: {
    livePreview: {
      collections: ['pages'],
      url({ data }) {
        return `/${data.slug}`
      },
    },
  },
})
```

The plugin relies on Payload's standard `admin.livePreview.url`. Without it, the preview pane shows a setup hint.

The plugin also auto-registers a `BetterEditorSettings` global (slug `better-editor-settings`, group "Site") for editor-wide options the user can change in the admin without redeploying.

### 2. Add `data-better-editor-id` to your block wrappers
Each rendered block needs a unique `data-better-editor-id` so the editor can resolve clicks back to a form-state path. Use the block row's `id`:

```tsx
export function RenderBlocks({ blocks }) {
  return blocks.map((block) => (
    <div key={block.id} data-better-editor-id={block.id}>
      {/* block content */}
    </div>
  ))
}
```

Works at arbitrary nesting depth — a click on a block inside a Columns block walks up to the innermost `[data-better-editor-id]` and selects that block.

**Lexical-embedded blocks** — if a block-typed field appears inside a Lexical RichText, wrap each JSX converter the same way:

```tsx
const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    banner: ({ node }) => (
      <div data-better-editor-id={node.fields.id}>
        <BannerBlock {...node.fields} />
      </div>
    ),
    // …same for every block type registered in the editor
  },
})
```

**Scope** — the editor resolves `blocks`-field rows. `array`-field rows (e.g. an array of column objects inside a Content block) are not selectable; mark only the rows that live inside a `blocks` field.

## Plugin options
Passed to `betterEditor({ … })`:

| Option | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Disable the plugin entirely |
| `collections` | `string[]` | `[]` | Collection slugs where the toggle should appear |
| `globals` | `string[]` | `[]` | Global slugs where the toggle should appear |
| `blocksField` | `string` | `'layout'` | Name of the document field holding the top-level blocks array |
| `adminPortalSelector` | `string` | Payload `__main-wrapper` | CSS selector for the admin element the overlay portals into. Override only if the default selector breaks against a future Payload version. Falls back to `<main>` then `<body>`. |
| `storageNamespace` | `string` | `'better-editor'` | Prefix for `localStorage` keys (sidebar width, responsive viewport width, toggle preference). Set if multiple instances on the same origin would otherwise collide. |
| `showSettingsBanner` | `boolean` | `true` | Show the plugin info banner (version, GitHub links) at the top of the `BetterEditorSettings` global. Set to `false` to hide it from end users. |

### CSS variable overrides

The overlay and the in-iframe hover toolbar expose two z-index custom properties so consumers can keep their own modals on top:

| Variable | Default | Scope |
|---|---|---|
| `--better-editor-z-overlay` | `50` | Overlay shell (admin document) |
| `--better-editor-z-toolbar` | `2147483647` | Hover-action toolbar (preview iframe document) |

## Runtime settings
`BetterEditorSettings` global, editable in the admin. Defaults shown.

| Field | Type | Default | Description |
|---|---|---|---|
| `sidebarPosition` | `'left' \| 'right'` | `'right'` | Side of the overlay the sidebar sits on |
| `forceFullWidthFields` | `boolean` | `true` | Stack sidebar fields vertically by overriding `admin.width` |
| `tabletWidth` | `number` | `800` | Tablet viewport width in px |
| `mobileWidth` | `number` | `400` | Mobile viewport width in px |
| `hoverColorTopLevel` | `string` | `'#3b82f6'` | Outline + tint color for top-level block hover |
| `hoverColorNested` | `string` | `'#f59e0b'` | Outline + tint color for nested block hover |
| `hoverOutlineWidth` | `number` | `2` | Outline width in px (1–5) |
| `showHoverToolbar` | `boolean` | `true` | Show the floating action toolbar on hovered blocks |
| `hoverToolbarPosition` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Toolbar anchor corner |

## Module layout
The plugin source lives under `src/` with the following top-level split:

| Folder | Purpose |
|---|---|
| `admin/` | All Payload admin UI components (`'use client'`). Holds the overlay shell, sidebar tabs, the preview frame, viewport controls, and the block-action UI. |
| `preview/` | Iframe-side bridge — installed into the consumer's preview document. Click-to-focus, hover styles, the hover toolbar controller, and the parent-postMessage protocol. |
| `hooks/` | React hooks shared between admin components (resize, viewport state, focus trap, preview binding/sync, block actions, …). |
| `state/` | Long-lived state contexts: settings (`BetterEditorSettings`) and undo/redo history. |
| `providers/` | Top-level overlay provider tree, including the runtime config context (storage namespace, labels). |
| `internal/` | Private utilities: storage, postMessage, path helpers, DOM constants. Not part of the public API. |
| `styles/` | Plain CSS, opted in via `import` side-effects. |
| `index.ts` / `client.ts` | Public entry points (server plugin factory + client UI). |

## Multi-tenant access control

The auto-registered `BetterEditorSettings` global ships with `access: { read: () => true }` so any authenticated admin can read it (the values are cosmetic — colours, viewport widths, sidebar position).

If you need stricter access — say, per-tenant settings or admin-only editing — override the global yourself **before** the plugin sees it, or wrap the field with your own access check. The plugin only registers the global if no global with the same slug already exists, so you can ship your own under `BETTER_EDITOR_SETTINGS_SLUG` and the auto-registration will skip:

```ts
import { betterEditorSettingsGlobal, BETTER_EDITOR_SETTINGS_SLUG } from 'payload-better-editor'

const tenantSettings: GlobalConfig = {
  ...betterEditorSettingsGlobal,
  access: { read: ({ req }) => req.user?.role === 'admin' },
}

export default buildConfig({
  globals: [tenantSettings],
  plugins: [betterEditor({ collections: ['pages'] })],
})
```

Do not add sensitive fields to `BetterEditorSettings` without tightening the read access first.

## Security: iframe trust boundary

The plugin renders the consumer's `admin.livePreview.url` in an unsandboxed `<iframe>` so the preview can run scripts, render forms, and apply styles normally. That means the preview origin is part of the editor's trust boundary:

- Serve the preview from an origin you control. The plugin enforces same-origin postMessage, but a compromised preview can still read whatever the parent admin can read in the same origin.
- Consider a strong Content-Security-Policy on the preview frontend (`frame-ancestors`, `script-src`).
- The hover-colour fields validate input against a strict regex; arbitrary CSS still won't reach the preview document. Don't relax that validation if you customise the settings global.

## Troubleshooting

### Clicking blocks in the preview does nothing

The iframe loaded but no `[data-better-editor-id]` elements were found. Spread `getBlockProps(block)` on each block wrapper in your frontend (see step 2 above), and on each Lexical block converter if you embed blocks in rich text. In dev mode the browser console prints a `[better-editor]` warning when this happens.

### The "Open Better Editor" toggle button is missing

The toggle only renders once `previewURL` resolves through Payload's `useLivePreviewContext`. Two common causes:

- The collection or global has no `admin.livePreview.url` configured. Add one (see Setup above).
- The page is brand-new and your `livePreview.url(({ data }) => …)` callback returns nothing because required fields like `slug` aren't set yet. Save the document with the required fields first; the toggle appears once the URL function returns a value.

### Click-to-edit, hover styles, and the toolbar do nothing

Most likely the preview is being served from a different origin than the Payload admin. The plugin needs same-origin to instrument the iframe. Either serve the preview from the admin origin (e.g. through a route in the same Next.js app), or run a reverse-proxy that places both behind one host. In dev mode you'll see a `[better-editor]` console warning explaining this.

### Sidebar tab is empty when a block should be selected

The plugin walks form-state paths like `layout.0`. Check that:

- `blocksField` matches your document's blocks-field name (default is `'layout'`)
- The selected element's `data-better-editor-id` matches the row's `id` in form state

### Multiple plugins are fighting over the document toggle

`betterEditor()` injects into `beforeDocumentControls`. If another plugin appends to the same array, both buttons render in insertion order. Adjust your `plugins: []` order if you want a specific layout.

### `[better-editor] settings fetch returned HTTP …` in the console

The plugin couldn't read `BetterEditorSettings`. Common causes: the global's `access.read` denies the current user, or the global wasn't migrated yet. The editor falls back to defaults — runtime settings just won't be customisable until the fetch succeeds.

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md).
