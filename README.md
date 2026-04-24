# payload-better-editor

A block-aware editor for [Payload CMS](https://payloadcms.com) — render the live draft page next to a sidebar, click blocks in the preview to edit their settings.

> **Work in progress.** This is v0.1.0 Single blocks can be selected and edited. Block management (reorder, add, remove) still runs through Payload's classic edit view — open the Better Editor alongside, not instead.

## What it does

On the collections you opt in, the plugin adds an **"Open Better Editor"** button to the document's control row. Clicking it overlays the edit view (status row + admin chrome stay visible) with:

- **Left:** an iframe loading Payload's configured live-preview URL — the actual rendered draft page. Hovering a top-level block shows a blue outline; clicking one focuses it in the sidebar.
- **Right:** a sidebar with two tabs:
  - **Page** — document-level fields (title, SEO, sidebar groups, …) with block fields filtered out
  - **Block** — Payload's native field widgets for the currently focused block

Because the overlay is portaled out of the edit view's `<Form>`, `useForm` / `useField` / `RenderFields` all bind to the exact same form state as the classic edit view. Saving works via Payload's normal Save / Publish buttons in the status row — once saved, the iframe refreshes automatically (via the consumer's `<RefreshRouteOnSave />`).

The open/closed state is persisted via Payload's user preferences, so the editor stays where the user left it across sessions and devices.

## Installation

```bash
pnpm add payload-better-editor
# or
npm install payload-better-editor
```

### 1. Register the plugin

```ts
// payload.config.ts
import { betterEditor } from 'payload-better-editor'

export default buildConfig({
  plugins: [
    betterEditor({
      collections: ['pages'], // slugs where the toggle should appear
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

The plugin relies on Payload's standard `admin.livePreview.url` for each collection you enable it on. If live preview isn't configured, the left pane shows a setup hint instead of an iframe.

### 2. Wrap your block renderer on the frontend

Add one `<div data-better-editor-blocks>` around your top-level blocks renderer:

```tsx
<main>
  <RenderHero hero={hero} />
  <div data-better-editor-blocks>
    <RenderBlocks blocks={layout} />
  </div>
</main>
```

That's the only frontend markup change needed. The editor resolves clicks in the preview to the top-level blocks by matching `[data-better-editor-blocks] > *` and indexing by DOM position. Nested blocks (e.g. a Text inside a Columns block) are automatically handled — a click anywhere inside a top-level block walks up via `closest()` and selects the outer block.

If your markup differs, override the selector via the `topLevelBlocksSelector` plugin option.

### 3. Install `<RefreshRouteOnSave />` on the frontend

```tsx
// e.g. in your page.tsx during draft mode
import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'

{draft && <RefreshRouteOnSave refresh={router.refresh} serverURL={serverURL} />}
```

After every save in the Better Editor, the plugin posts a `payload-document-event` into the iframe, which this listener turns into a `router.refresh()`. Without it, the iframe won't reflect saved changes until you close and reopen the editor.

## Plugin options

| Option | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Disable the plugin entirely |
| `collections` | `string[]` | `[]` | Collection slugs where the toggle should appear |
| `blocksField` | `string` | `'layout'` | Name of the document field that holds the top-level blocks array |
| `topLevelBlocksSelector` | `string` | `'[data-better-editor-blocks] > *'` | CSS selector that matches each top-level block's outermost element in the rendered frontend |
