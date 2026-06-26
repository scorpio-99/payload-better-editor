# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]
### Added
- German (`de`) translation: all UI strings are now translatable. English (`en`) remains the default. The active language follows Payload's admin UI language setting; translations are injected automatically by the plugin via `config.i18n.translations`.
### Fixed
- Blocks inside named tabs were not resolved: the schema path walker assumed every field is followed by an array index, but named tabs own a path segment without one. The walker now steps dynamically — named tabs (and groups) consume only their own segment; `blocks` and `array` fields still consume the following index.
- `betterEditorSettingsGlobal` was not exported from the package even though the docs described using it for multi-tenant access control overrides.

## [1.2.2]
### Fixed
- Hydration mismatch in App Router frontends: the hover variables (`--bee-top`, `--bee-nested`, `--bee-outline-width`) were written as an inline `style` on the preview iframe's `<html>` element, which the consumer's `RootLayout` hydrates — an attribute the server never rendered. They are now injected through the plugin's own `<style>` (a `:root` rule), leaving the consumer page's `<html>` untouched. ([#20](https://github.com/scorpio-99/payload-better-editor/issues/20))

## [1.2.1]
### Changed
- Escape no longer closes the editor. The overlay is a full working surface rather than a transient modal, so closing it on Escape was surprising — and it fired alongside the Escape that dismisses an open Payload drawer, tearing the whole editor down together with the drawer. Close via the toggle button instead; browser-native Escape still exits fullscreen. ([#18](https://github.com/scorpio-99/payload-better-editor/issues/18))

## [1.2.0]
### Added
- Per-collection/global `blocksField`: `collections` and `globals` now also accept a `{ slug: { blocksField } }` record, so entities can use different blocks-field names. The plain slug-array form still works. ([#13](https://github.com/scorpio-99/payload-better-editor/issues/13))
### Fixed
- Editor no longer crashes (`Cannot read properties of undefined (reading 'length')`) when the blocks field uses Payload's `blockReferences` instead of inline `blocks` — block configs are now resolved from the client config's block registry. ([#14](https://github.com/scorpio-99/payload-better-editor/issues/14))
- Hovering/selecting a block no longer overrides its `background-color` (which clobbered dark/muted block backgrounds). The highlight tint is now an `inset box-shadow` painted over the block's own background. ([#15](https://github.com/scorpio-99/payload-better-editor/issues/15))
### Docs
- Setup guide now documents `admin.preview` (collection/global level) as the source of the preview URL that surfaces the toggle, instead of `admin.livePreview.url`, which the plugin does not read. ([#16](https://github.com/scorpio-99/payload-better-editor/issues/16))
- Clarified that the preview only reflects edits once the document is saved (enable drafts + autosave for automatic refresh), and that `blocksField` is unrelated to RichText-embedded blocks (which are selected purely via `data-better-editor-id`).

## [1.1.0]
### Added
- Validation summary in the sidebar: after a failed save, every invalid field across all blocks is listed (not just the selected block, which the overlay otherwise hides behind Payload's own form). Block-field entries are clickable to jump straight to the offending block.
### Changed
- **Removed the `lucide-react` peer dependency.** The ~20 icons the editor uses are now vendored inline (ISC-licensed; attribution in the icons source header), so consumers no longer need `lucide-react` installed at a compatible version. ([#11](https://github.com/scorpio-99/payload-better-editor/issues/11))
### Fixed
- Admin crashed with `Export MousePointer2Off doesn't exist` when the host project resolved an older `lucide-react` than the plugin's peer range. Vendoring the icons removes the version-skew failure mode entirely. ([#11](https://github.com/scorpio-99/payload-better-editor/issues/11))
### Performance
- Sidebar and preview resize drags now coalesce `mousemove` updates into one render per animation frame instead of one per event.
- The live preview width readout no longer re-renders the overlay on every `ResizeObserver` tick — it's isolated to the toolbar's width chip via `useSyncExternalStore`.
- The sidebar, preview frame, and toolbar are memoized so resize-drag re-renders skip the rendered field tree.

## [1.0.4]
### Fixed
- Firefox: preview iframe binding crashed with `TypeError: can't access property "href", doc.location is null` and got stuck on the loading skeleton. Firefox can briefly expose a Document whose `location` is `null` during the initial `about:blank` phase of a freshly mounted iframe; the binding hook read `doc.location.href` and threw before installing hover/click handlers or clearing the loading state. `getSameOriginDocument` now treats a missing `location` as "not ready" (returns `null`), and the readiness probe uses the non-nullable `doc.URL` instead of `doc.location.href`. ([#9](https://github.com/scorpio-99/payload-better-editor/issues/9))

## [1.0.3]
### Fixed
- Init-time `hasBlocksField` check now recurses into presentational containers (`row`, `collapsible`, unnamed `tabs`) when looking for `blocksField`. Previously the check only inspected the collection/global's top-level field array, so configs that placed `layout` inside a `tabs` field — the layout the plugin's own docs describe ("Page, Blocks, Settings tabs auto-derived from your document's tab structure") — triggered a spurious `[better-editor] collection "…" has no top-level field named "layout"` warning. Resolution still skips `group` and *named* tabs, since those introduce a path segment in the form state (`group.layout` vs. `layout`) and would not match a `blocksField` lookup at the document root.

## [1.0.2]
### Docs
- DEVELOPERS.md: add explicit `pnpm payload generate:importmap` step right after the plugin-registration step. Without it Payload's admin throws `getFromImportMap: PayloadComponent not found` for the toggle button and settings banner.

## [1.0.1]
### Fixed
- Published `package.json` `exports` / `main` / `types` now point at `./dist/...` directly. The 1.0.0 tarball still pointed at `./src/index.ts` because `publishConfig.exports` is only merged by `pnpm publish`, not `npm publish`, leaving consumers with `TS2307: Cannot find module 'payload-better-editor'`.

## [1.0.0]
Initial release.
