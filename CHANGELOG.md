# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [1.0.0]
Initial release.

### Features
- `betterEditor()` plugin with per-collection opt-in
- Fullscreen Live Editor overlay with live preview iframe + 3-tab sidebar (Page / Blocks / Settings, auto-split via `admin.position`)
- Click any block in the preview to edit its fields via Payload's native `RenderFields` — supports arbitrary nesting
- Block actions (move / duplicate / add / delete) from both the sidebar and an iframe hover toolbar
- Viewport toggle: Desktop, Tablet, Mobile, Responsive (drag-resizable), Fullscreen
- Undo / Redo for block actions (`Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z`)
- Drag-resizable sidebar
- `BetterEditorSettings` global for sidebar position, hover colors, breakpoint widths, hover-toolbar options
