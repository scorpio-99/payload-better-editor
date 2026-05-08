export type BetterEditorConfig = {
  /** Skip plugin installation entirely (e.g. behind a feature flag). */
  disabled?: boolean
  /**
   * Collection slugs that should get the "Open Better Editor" toggle in
   * their `beforeDocumentControls`. Each collection must have an
   * `admin.livePreview.url` configured for the preview to render.
   */
  collections?: string[]
  /**
   * Global slugs that should get the "Open Better Editor" toggle in
   * their `beforeDocumentControls`. Each global must have an
   * `admin.livePreview.url` configured for the preview to render.
   */
  globals?: string[]
  /**
   * Name of the `blocks` field inside the configured collections/globals
   * that the sidebar should target. Top-level only for now; nested paths
   * (e.g. `content.layout`) are not supported. Defaults to `'layout'`.
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
}
