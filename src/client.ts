export { LiveEditorToggle } from './admin/LiveEditorToggle'
export { LiveEditorOverlay } from './admin/LiveEditorOverlay'
export type { LiveEditorOverlayProps } from './admin/LiveEditorOverlay'
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
