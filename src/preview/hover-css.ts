export const HOVER_STYLE_ID = 'better-editor-hover-style'
export const TOOLBAR_ID = 'better-editor-block-toolbar'

// Dynamic values come from CSS vars set via setHoverVars(); .better-editor-active
// keeps the outline visible when the cursor moves to the floating toolbar.
export const HOVER_CSS = `
  [data-better-editor-id] { cursor: pointer; }
  [data-better-editor-id]:hover,
  [data-better-editor-id].better-editor-active {
    outline: var(--bee-outline-width) solid var(--bee-top);
    outline-offset: calc(-1 * var(--bee-outline-width));
    background-color: color-mix(in srgb, var(--bee-top) 10%, transparent);
  }
  [data-better-editor-id] [data-better-editor-id]:hover,
  [data-better-editor-id] [data-better-editor-id].better-editor-active {
    outline-color: var(--bee-nested);
    background-color: color-mix(in srgb, var(--bee-nested) 10%, transparent);
  }

  #${TOOLBAR_ID} {
    position: absolute;
    z-index: 2147483647;
    display: none;
    gap: 2px;
    padding: 3px;
    border-radius: 4px;
    background: var(--bee-top);
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    font-family: system-ui, sans-serif;
  }
  #${TOOLBAR_ID}[data-nested="1"] { background: var(--bee-nested); }
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
  root.style.setProperty('--bee-top', vars.topColor)
  root.style.setProperty('--bee-nested', vars.nestedColor)
  root.style.setProperty('--bee-outline-width', `${vars.outlineWidth}px`)
}
