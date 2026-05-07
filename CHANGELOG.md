# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [1.0.0]

Initial release.

### Features

- `betterEditor()` plugin with per-collection and per-global opt-in
- Side-by-side editor overlay with a live-preview iframe and a 3-tab sidebar (Page, Blocks, Settings) auto-derived from your document's tab structure
- Click any block in the preview to edit its fields via Payload's native `RenderFields`; works at any nesting depth
- Floating in-iframe hover toolbar with move up, move down, duplicate, add-below, delete
- Mirror block actions in the sidebar's Blocks tab (same form-state mutations, shared undo/redo history)
- Viewport toggle: Desktop, Tablet, Mobile, Responsive (drag-resizable with live width chip), Fullscreen
- Undo and Redo with `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`
- Drag-resizable sidebar with collapse toggle; width persisted to localStorage
- Interact mode toggle so clicks pass through to forms, accordions, and links inside the preview
- `getBlockProps(block)` helper for the consumer's frontend to mark blocks as editable
- `BetterEditorSettings` global for sidebar position, hover colors, breakpoint widths, hover-toolbar position and visibility
- Loading skeleton in the iframe and an error boundary so a single bad block can't take the admin down
