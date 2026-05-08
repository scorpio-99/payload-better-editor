/**
 * The button rendered in `beforeDocumentControls` that toggles the
 * Better Editor overlay. Auto-injected by the plugin factory; consumers
 * usually don't render it directly.
 */
export { LiveEditorToggle } from './admin/LiveEditorToggle'
export type { LiveEditorToggleProps } from './admin/LiveEditorToggle'

/**
 * The full editor overlay (preview iframe + 3-tab sidebar). Mounted into
 * the Payload admin shell when the toggle opens it. Exported so consumers
 * can build a custom toggle / wrapper if they need to bypass the
 * auto-injected button.
 */
export { LiveEditorOverlay } from './admin/LiveEditorOverlay'
export type { LiveEditorOverlayProps } from './admin/LiveEditorOverlay'

/**
 * Banner shown at the top of the `BetterEditorSettings` global. Wired up
 * automatically; hide it via `betterEditor({ showSettingsBanner: false })`.
 */
export { SettingsBanner } from './admin/SettingsBanner'

/**
 * Spread these props on every block wrapper in your frontend so the
 * Better Editor can target it. The plugin uses the resulting
 * `data-better-editor-id` attribute for hover outlines, click-to-focus,
 * the in-iframe action toolbar, and selection sync.
 *
 * @example
 *   import { getBlockProps } from 'payload-better-editor/client'
 *
 *   <section {...getBlockProps(block)}>...</section>
 */
export const getBlockProps = (
  block: { id?: string | null },
): Record<string, string> =>
  block.id ? { 'data-better-editor-id': block.id } : {}
