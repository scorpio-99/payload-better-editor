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
}
