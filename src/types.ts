export type BetterEditorConfig = {
  /**
   * Disable the plugin entirely. Useful for feature flags or gating by environment.
   */
  disabled?: boolean
  /**
   * Collection slugs on which the Better Editor toggle should appear. Collections
   * not listed here keep the default Payload edit view only.
   */
  collections?: string[]
  /**
   * Name of the document field that contains the top-level blocks array.
   * Defaults to `'layout'`.
   */
  blocksField?: string
}
