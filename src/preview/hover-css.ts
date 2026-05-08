import { ACTIVE_CLASS, BLOCK_ID_ATTR } from '../internal/dom'

export const HOVER_STYLE_ID = 'better-editor-hover-style'
export const TOOLBAR_ID = 'better-editor-block-toolbar'
// Set on doc.body to disable hover affordances + click-to-focus while
// the user wants to interact with the consumer page (forms, accordions,
// links). All hover/active rules below are gated on its absence.
export const INTERACT_BODY_ATTR = 'data-bee-interact'

const VAR_TOP = '--bee-top'
const VAR_NESTED = '--bee-nested'
const VAR_OUTLINE_WIDTH = '--bee-outline-width'

export const HOVER_CSS = `
  body:not([${INTERACT_BODY_ATTR}]) [${BLOCK_ID_ATTR}] { cursor: pointer; }
  body:not([${INTERACT_BODY_ATTR}]) [${BLOCK_ID_ATTR}]:hover,
  body:not([${INTERACT_BODY_ATTR}]) [${BLOCK_ID_ATTR}].${ACTIVE_CLASS} {
    outline: var(${VAR_OUTLINE_WIDTH}) solid var(${VAR_TOP});
    outline-offset: calc(-1 * var(${VAR_OUTLINE_WIDTH}) - 1px);
    background-color: color-mix(in srgb, var(${VAR_TOP}) 10%, transparent);
  }
  body:not([${INTERACT_BODY_ATTR}]) [${BLOCK_ID_ATTR}] [${BLOCK_ID_ATTR}]:hover,
  body:not([${INTERACT_BODY_ATTR}]) [${BLOCK_ID_ATTR}] [${BLOCK_ID_ATTR}].${ACTIVE_CLASS} {
    outline-color: var(${VAR_NESTED});
    background-color: color-mix(in srgb, var(${VAR_NESTED}) 10%, transparent);
  }
  body[${INTERACT_BODY_ATTR}] #${TOOLBAR_ID} { display: none; }

  #${TOOLBAR_ID} {
    position: absolute;
    z-index: var(--better-editor-z-toolbar, 2147483647);
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

// Restrictive on purpose: these values are written verbatim into a CSS
// custom property on the preview iframe, so anything that survives the
// regex still lands inside `outline:` / `background-color:` and can't
// escape into a separate declaration.
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^rgba?\(/i

const isValidColor = (v: unknown): v is string =>
  typeof v === 'string' && COLOR_RE.test(v.trim())

const isValidOutline = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 50

const warnInvalid = (kind: string, value: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[better-editor] ignoring invalid ${kind}:`, value)
  }
}

export const setHoverVars = (doc: Document, vars: HoverVars): void => {
  const root = doc.documentElement
  if (isValidColor(vars.topColor)) {
    root.style.setProperty(VAR_TOP, vars.topColor)
  } else {
    warnInvalid('topColor', vars.topColor)
  }
  if (isValidColor(vars.nestedColor)) {
    root.style.setProperty(VAR_NESTED, vars.nestedColor)
  } else {
    warnInvalid('nestedColor', vars.nestedColor)
  }
  if (isValidOutline(vars.outlineWidth)) {
    root.style.setProperty(VAR_OUTLINE_WIDTH, `${vars.outlineWidth}px`)
  } else {
    warnInvalid('outlineWidth', vars.outlineWidth)
  }
}

export const clearHoverVars = (doc: Document): void => {
  const root = doc.documentElement
  root.style.removeProperty(VAR_TOP)
  root.style.removeProperty(VAR_NESTED)
  root.style.removeProperty(VAR_OUTLINE_WIDTH)
}
