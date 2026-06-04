import type { CollectionSlug, GlobalSlug } from 'payload'

/** Per-entity overrides for a collection/global. */
export type BetterEditorEntityOptions = {
  /** Blocks-field name for this entity; falls back to the top-level `blocksField`. */
  blocksField?: string
}

export type BetterEditorConfig = {
  /** Skip plugin installation entirely (e.g. behind a feature flag). */
  disabled?: boolean
  /**
   * Collections that get the "Open Better Editor" toggle. Either a list of
   * slugs, or a slug → options record for per-collection settings (e.g. a
   * different `blocksField`). Each collection needs `admin.preview` configured
   * for the preview to render and the toggle to appear.
   */
  collections?: string[] | Partial<Record<CollectionSlug, BetterEditorEntityOptions>>
  /**
   * Globals that get the "Open Better Editor" toggle — a list of slugs or a
   * slug → options record. Each global needs `admin.preview` configured for the
   * toggle to appear.
   */
  globals?: string[] | Partial<Record<GlobalSlug, BetterEditorEntityOptions>>
  /**
   * Default name of the `blocks` field the sidebar targets. Top-level only;
   * nested paths (e.g. `content.layout`) are not supported. Per-collection
   * overrides via the `collections`/`globals` record take precedence.
   * Defaults to `'layout'`.
   */
  blocksField?: string
  /**
   * CSS selector for the Payload admin element the overlay portals into.
   * Override only if the default selector breaks against a future Payload
   * version. The plugin falls back to `<main>` and finally `<body>`.
   */
  adminPortalSelector?: string
  /**
   * Prefix for all `localStorage` keys the editor writes (sidebar width,
   * responsive viewport width, …). Set this if multiple Better Editor
   * instances share the same origin and would otherwise collide.
   * Defaults to `'better-editor'`.
   */
  storageNamespace?: string
  /**
   * Show the plugin info banner (version, GitHub links, "Report a bug")
   * at the top of the `BetterEditorSettings` global. Set to `false` to
   * hide it for end users. Defaults to `true`.
   */
  showSettingsBanner?: boolean
}
