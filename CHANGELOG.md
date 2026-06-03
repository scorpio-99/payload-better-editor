# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [1.1.0]
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
