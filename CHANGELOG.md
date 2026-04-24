# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]
### Added
- Plugin scaffold (`betterEditor` factory, `BetterEditorConfig`)
- `collections` opt-in option — per-collection toggle injection
- Live Editor toggle in the edit view (`LiveEditorToggle`)
- Fullscreen Live Editor overlay (`LiveEditorOverlay`) mounted via React portal
- Split layout: preview pane (block list) + sidebar with Page / Block tabs
- `FieldEditor` — generic scalar field editor bound to Payload's form state via `useField`
- Auto-tab switch when a block is selected in the preview
- ESC key closes the overlay

### Known limitations
- Preview is a structural block list, not yet a visual inline-editable rendering
- Only top-level scalar fields are editable in the sidebar; nested arrays / groups must still be edited in the classic form
- Injected toggle overwrites `admin.components.edit.Description` if set by the consumer
