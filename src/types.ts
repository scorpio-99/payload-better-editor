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
  /**
   * CSS selector that, when run against the preview iframe's document, returns
   * the top-level block DOM elements in the same order as the form state's
   * `blocksField` array.
   *
   * Defaults to `'[data-better-editor-blocks] > *'`. With the default, wrap
   * your frontend block renderer in a single div:
   *
   *   <div data-better-editor-blocks>
   *     <RenderBlocks blocks={layout} />
   *   </div>
   *
   * Override if your frontend markup differs — the selector just needs to
   * match each top-level block's outermost element.
   */
  topLevelBlocksSelector?: string
}
