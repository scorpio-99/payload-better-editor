# payload-better-editor
A Volto-inspired live editor for [Payload CMS](https://payloadcms.com) — edit pages inline next to a live-preview iframe with a block-aware sidebar.

![Better Editor overview](./assets/overview.gif)

> **Found a bug?** Please [open an issue](https://github.com/scorpio-99/payload-better-editor/issues/new) with steps to reproduce, your Payload version, and a minimal example. PRs welcome too.

## Features
- **Live Editor overlay** — fullscreen overlay portaled into Payload's edit view; left side shows the live-preview iframe, right side a 3-tab sidebar (Page / Blocks / Settings)
- **Click-to-edit** — hover or click any block in the preview to focus it; the Blocks tab renders its fields with Payload's native `RenderFields`. Works at arbitrary nesting depth.
- **Block actions** — move / duplicate / add / delete from either the sidebar toolbar or a floating hover toolbar in the iframe
- **Add Block drawer** — Payload's native picker, scoped to the parent's allowed block list
- **Viewport toggle** — Desktop, Tablet, Mobile, Responsive (drag handles + live width chip), Fullscreen (Browser Fullscreen API)
- **Undo / Redo** — snapshot-based, with `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`
- **Drag-resizable sidebar** — width persisted in localStorage
- **Page / Settings tab split** — auto-derived from each field's `admin.position` — no hardcoded field names
- **Loading skeleton** in the iframe while the preview boots
- **Error boundary** around the overlay so a single bad block can't take the admin down

![Block actions in preview](./assets/block-actions.gif)

## Quick start
```bash
pnpm add payload-better-editor
```
See [DEVELOPERS.md](./DEVELOPERS.md) for the full setup, plugin options, runtime settings, and architecture notes.

## Contributors
<a href="https://github.com/scorpio-99/payload-better-editor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=scorpio-99/payload-better-editor" />
</a>
