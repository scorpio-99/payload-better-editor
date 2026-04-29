import { ICON_SVG } from '../icons'

export const TOOLBAR_HTML = `
  <button data-action="move-up" title="Move up" aria-label="Move block up">${ICON_SVG.chevronUp}</button>
  <button data-action="move-down" title="Move down" aria-label="Move block down">${ICON_SVG.chevronDown}</button>
  <button data-action="duplicate" title="Duplicate" aria-label="Duplicate block">${ICON_SVG.copy}</button>
  <button data-action="add" title="Add block below" aria-label="Add block below">${ICON_SVG.plus}</button>
  <button data-action="delete" title="Delete" aria-label="Delete block">${ICON_SVG.trash}</button>
`
