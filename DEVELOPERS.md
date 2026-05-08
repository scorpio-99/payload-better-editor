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
| `internal/` | Private utilities: storage, postMessage, path helpers, labels defaults, DOM constants. Not part of the public API. |
| `styles/` | Plain CSS, opted in via `import` side-effects. |
| `index.ts` / `client.ts` | Public entry points (server plugin factory + client UI). |

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md).
