# TODO

## Core

- **Block management (add / move / delete / duplicate)** — no in-editor way to mutate the blocks array yet. First pass: embed Payload's native Blocks field UI in the sidebar (reuses drag handle, 3-dot menu, add button for free). Next pass: Volto-style inline toolbar in the iframe (hover controls on each block for delete / duplicate / insert above / insert below + drag handle).

## Iframe / preview

- **Device/breakpoint preview** — let users switch between desktop / tablet / mobile widths for the iframe, mirroring Payload's native LivePreview toolbar.
- **Loading state** — the iframe fades in blank while the page boots. Add a subtle loading indicator and a fallback when the preview fails (network error, preview secret mismatch, etc.).

## Sidebar

- **Sidebar width** — fixed at 380 px; make resizable + persist in preferences.

## Toggle / integration

- **Global docs** — plugin only targets collections via `collections`. Add `globals` opt-in for Payload global config editing.

## Dev / quality

- **Error boundaries** — wrap the overlay and each tab so a single field blowing up doesn't kill the whole editor.
