# payload-better-editor

[![npm](https://img.shields.io/npm/v/payload-better-editor?logo=npm&color=ce421b)](https://www.npmjs.com/package/payload-better-editor)
[![downloads](https://img.shields.io/npm/dt/payload-better-editor?logo=npm&color=ce421b)](https://www.npmjs.com/package/payload-better-editor)
[![stars](https://img.shields.io/github/stars/scorpio-99/payload-better-editor?logo=github)](https://github.com/scorpio-99/payload-better-editor)

Block editor plugin for [Payload CMS](https://payloadcms.com) that adds a side-by-side live-preview iframe and sidebar to the edit view. Hover any block in the preview to see it highlighted with a floating action toolbar (move, duplicate, add, delete); click it to open its fields in the sidebar. The sidebar mirrors your document's real tabs (page-level fields, the selected block's fields, and document settings) and renders everything with Payload's own field components, validations, and access control.

![Better Editor overview](./assets/overview.gif)

> **Found a bug?** Early-stage plugin, feedback is appreciated. [Open an issue](https://github.com/scorpio-99/payload-better-editor/issues/new) with steps to reproduce, your Payload version, and a minimal example. PRs welcome.

## Features

- **Live preview iframe** with viewport switcher (Desktop, Tablet, Mobile, Responsive with drag handles, Fullscreen)
- **Click-to-edit** any block at any nesting depth. The sidebar opens with the block's fields rendered via Payload's `RenderFields`, so custom field components, validations, and access control all just work
- **Floating in-iframe toolbar** on hover with move up, move down, duplicate, add-below, delete
- **Page, Blocks, Settings tabs** auto-derived from your document's tab structure
- **Undo and Redo** snapshot-based, with `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`
- **Interact mode** toggle so clicks pass through to forms, accordions, links inside the preview
- **Drag-resizable sidebar** with collapse toggle; width persisted to localStorage
- **Loading skeleton** in the iframe and an error boundary so a single bad block can't take the admin down

![Block actions in preview](./assets/block-actions.gif)

## Install

```bash
pnpm add payload-better-editor
```

See [DEVELOPERS.md](./DEVELOPERS.md) for setup, plugin options, runtime settings, and architecture notes.

## Requirements

- Payload `>=3.81.0`
- React 19

## Contributors

<a href="https://github.com/scorpio-99/payload-better-editor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=scorpio-99/payload-better-editor" />
</a>
