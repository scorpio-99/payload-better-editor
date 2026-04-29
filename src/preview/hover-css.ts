export const HOVER_STYLE_ID = 'better-editor-hover-style'
export const TOOLBAR_ID = 'better-editor-block-toolbar'

export const TOOLBAR_CSS = `
  #${TOOLBAR_ID} {
    position: absolute;
    z-index: 2147483647;
    display: none;
    gap: 2px;
    padding: 3px;
    border-radius: 4px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    font-family: system-ui, sans-serif;
  }
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

// `:hover` propagates up the DOM, so hovering any descendant marks every
// ancestor block as hovered too — parent outline + tint persist while
// the cursor is anywhere inside it. The descendant selector overrides
// the color for nested blocks. `.better-editor-active` is JS-applied to
// the leaf so the outline persists when the cursor moves to the floating
// toolbar (which lives in document.body, outside the block tree).
export const makeIdHoverCss = (top: string, nested: string, width: number) => `
  [data-better-editor-id] { cursor: pointer; }
  [data-better-editor-id]:hover,
  [data-better-editor-id].better-editor-active {
    outline: ${width}px solid ${top};
    outline-offset: -${width}px;
    background-color: color-mix(in srgb, ${top} 10%, transparent);
  }
  [data-better-editor-id] [data-better-editor-id]:hover,
  [data-better-editor-id] [data-better-editor-id].better-editor-active {
    outline-color: ${nested};
    background-color: color-mix(in srgb, ${nested} 10%, transparent);
  }
`
