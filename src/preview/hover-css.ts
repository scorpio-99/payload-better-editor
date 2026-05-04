import { ACTIVE_CLASS, BLOCK_ID_ATTR } from '../internal/constants'

export const HOVER_STYLE_ID = 'better-editor-hover-style'
export const TOOLBAR_ID = 'better-editor-block-toolbar'

const VAR_TOP = '--bee-top'
const VAR_NESTED = '--bee-nested'
const VAR_OUTLINE_WIDTH = '--bee-outline-width'

// `.${ACTIVE_CLASS}` keeps the outline visible while the cursor is over the
// floating toolbar (toolbar lives in <body>, so :hover doesn't propagate).
export const HOVER_CSS = `
  [${BLOCK_ID_ATTR}] { cursor: pointer; }
  [${BLOCK_ID_ATTR}]:hover,
  [${BLOCK_ID_ATTR}].${ACTIVE_CLASS} {
    outline: var(${VAR_OUTLINE_WIDTH}) solid var(${VAR_TOP});
    outline-offset: calc(-1 * var(${VAR_OUTLINE_WIDTH}));
    background-color: color-mix(in srgb, var(${VAR_TOP}) 10%, transparent);
  }
  [${BLOCK_ID_ATTR}] [${BLOCK_ID_ATTR}]:hover,
  [${BLOCK_ID_ATTR}] [${BLOCK_ID_ATTR}].${ACTIVE_CLASS} {
    outline-color: var(${VAR_NESTED});
    background-color: color-mix(in srgb, var(${VAR_NESTED}) 10%, transparent);
  }

  #${TOOLBAR_ID} {
    position: absolute;
    z-index: 2147483647;
    display: none;
    gap: 2px;
    padding: 3px;
    border-radius: 4px;
    background: var(${VAR_TOP});
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    font-family: system-ui, sans-serif;
  }
  #${TOOLBAR_ID}[data-nested="1"] { background: var(${VAR_NESTED}); }
  #${TOOLBAR_ID}.is-visible { display: inline-flex; }
  #${TOOLBAR_ID} button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  #${TOOLBAR_ID} button:hover { background: rgba(255, 255, 255, 0.18); }
  #${TOOLBAR_ID} button[data-action="delete"]:hover { background: rgba(0, 0, 0, 0.25); }
`

export type HoverVars = {
  topColor: string
  nestedColor: string
  outlineWidth: number
}

export const setHoverVars = (doc: Document, vars: HoverVars): void => {
  const root = doc.documentElement
  root.style.setProperty(VAR_TOP, vars.topColor)
  root.style.setProperty(VAR_NESTED, vars.nestedColor)
  root.style.setProperty(VAR_OUTLINE_WIDTH, `${vars.outlineWidth}px`)
}

export const clearHoverVars = (doc: Document): void => {
  const root = doc.documentElement
  root.style.removeProperty(VAR_TOP)
  root.style.removeProperty(VAR_NESTED)
  root.style.removeProperty(VAR_OUTLINE_WIDTH)
}
