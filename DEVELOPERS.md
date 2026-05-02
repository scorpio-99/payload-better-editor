# payload-better-editor — Developer Guide

Full installation, configuration, and architecture reference. For a feature overview see the [README](./README.md).

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

### 3. Install `<RefreshRouteOnSave />` on the frontend

```tsx
import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'

// in your page during draft mode
{draft && <RefreshRouteOnSave refresh={router.refresh} serverURL={serverURL} />}
```

After every save in the editor the plugin posts a `payload-document-event` into the iframe — this listener turns it into a `router.refresh()`.

## Plugin options

Passed to `betterEditor({ … })`:

| Option | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Disable the plugin entirely |
| `collections` | `string[]` | `[]` | Collection slugs where the toggle should appear |
| `blocksField` | `string` | `'layout'` | Name of the document field holding the top-level blocks array |

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

## Architecture

The overlay is portaled into Payload's `__main-wrapper` so the admin status row + chrome stay visible. Because everything runs inside the document's `<Form>`, `useForm` / `useField` / `RenderFields` bind to the exact same form state as the classic edit view — saving works through Payload's normal Save / Publish buttons.

**Block selection:** every block in the preview emits `data-better-editor-id="<row-id>"`. Clicks in the iframe walk up to the innermost matching ancestor and post `{ type: 'focus-block', id }` to the parent window. The overlay scans the form-state map for `<path>.id === <row-id>` and uses the resolved path to render the block's fields in the sidebar.

**Block mutations** (move / duplicate / add / delete) dispatch Payload's native row actions through `useForm().dispatchFields(...)` and `addFieldRow(...)`, paired with `setModified(true)` so autosave + live-preview refresh fire as on a manual edit.

**Undo/Redo** snapshots the entire form state before each mutation and restores via `REPLACE_STATE`.

**Hover toolbar** inside the iframe is a React tree mounted via `createRoot` into the iframe document. Hover styles + tint use CSS custom properties (`--bee-top`, `--bee-nested`, `--bee-outline-width`) set on the iframe `:root`, so settings updates only touch those vars — no full CSS re-injection.

Same-origin iframe access only — cross-origin previews fall back to view-only mode.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
