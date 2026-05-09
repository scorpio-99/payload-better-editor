# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

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
