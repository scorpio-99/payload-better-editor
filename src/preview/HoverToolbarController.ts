import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import type { BlockActionMessage } from './protocol'
import { TOOLBAR_ID } from './hover-css'
import { TOOLBAR_HTML } from './toolbar-html'

export type HoverToolbarOptions = {
  topColor: string
  nestedColor: string
  position: HoverToolbarPosition
  onAction: (id: string, action: BlockActionMessage['action']) => void
}

/**
 * Owns the floating action toolbar that appears over the currently-hovered
 * block inside the preview iframe. Encapsulates:
 *  - the toolbar DOM element (lives in `doc.body`)
 *  - the "sticky leaf" selection (currentBlockId / currentBlockEl)
 *  - mouseover listener (on the document) that picks new leaves
 *  - scroll listener (on the document's window, capture phase) that
 *    re-positions the toolbar so it tracks the block as the user scrolls
 *  - the toolbar's own click listener that dispatches block-action calls
 *
 * Construction binds all listeners. `update()` re-applies colors / position
 * without recreating the DOM node so visible state survives setting tweaks.
 * `destroy()` removes every listener, the toolbar node, and any
 * `.better-editor-active` markers we left on the page.
 */
export class HoverToolbarController {
  private doc: Document
  private opts: HoverToolbarOptions
  private toolbar: HTMLDivElement
  private currentBlockId: string | null = null
  private currentBlockEl: HTMLElement | null = null
  private onMove: (e: MouseEvent) => void
  private onScroll: () => void
  private onToolbarClick: (e: MouseEvent) => void

  constructor(doc: Document, opts: HoverToolbarOptions) {
    this.doc = doc
    this.opts = opts

    let toolbar = doc.getElementById(TOOLBAR_ID) as HTMLDivElement | null
    if (!toolbar) {
      toolbar = doc.createElement('div')
      toolbar.id = TOOLBAR_ID
      toolbar.innerHTML = TOOLBAR_HTML
      doc.body.appendChild(toolbar)
    } else {
      toolbar.innerHTML = TOOLBAR_HTML
    }
    this.toolbar = toolbar

    this.onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Inside the toolbar: keep current selection.
      if (this.toolbar.contains(target)) return
      const el = target.closest<HTMLElement>('[data-better-editor-id]')
      if (!el) {
        this.hide()
        return
      }
      if (el === this.currentBlockEl) return
      // Cursor wandered onto an ancestor of the current leaf — that
      // happens when crossing the gap between sibling children inside
      // a parent block. Keep the leaf so the toolbar doesn't flicker.
      // The parent's outline still shows (CSS `:hover` propagates).
      if (this.currentBlockEl && el.contains(this.currentBlockEl)) return
      this.showFor(el)
    }

    this.onScroll = () => this.positionToolbar()

    this.onToolbarClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('button[data-action]')
      if (!btn || !this.currentBlockId) return
      e.preventDefault()
      e.stopPropagation()
      const action = btn.getAttribute('data-action') as BlockActionMessage['action'] | null
      if (!action) return
      this.opts.onAction(this.currentBlockId, action)
    }

    this.doc.addEventListener('mouseover', this.onMove)
    this.doc.defaultView?.addEventListener('scroll', this.onScroll, true)
    this.toolbar.addEventListener('click', this.onToolbarClick)
  }

  /** Reapply colors/position without recreating the DOM node. */
  update(opts: HoverToolbarOptions): void {
    this.opts = opts
    // If we currently have a selection, re-tint the toolbar to match the
    // new top/nested colors and re-run the position calc against the
    // new `position` corner.
    if (this.currentBlockEl) {
      const isNested = !!this.currentBlockEl.parentElement?.closest('[data-better-editor-id]')
      this.toolbar.style.background = isNested ? opts.nestedColor : opts.topColor
      this.positionToolbar()
    }
  }

  destroy(): void {
    this.doc.removeEventListener('mouseover', this.onMove)
    this.doc.defaultView?.removeEventListener('scroll', this.onScroll, true)
    this.toolbar.removeEventListener('click', this.onToolbarClick)
    this.clearActive()
    if (this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar)
    }
    this.currentBlockId = null
    this.currentBlockEl = null
  }

  private positionToolbar(): void {
    if (!this.currentBlockEl) return
    const rect = this.currentBlockEl.getBoundingClientRect()
    const view = this.doc.defaultView
    if (!view) return
    const tbWidth = this.toolbar.offsetWidth || 120
    const tbHeight = this.toolbar.offsetHeight || 32
    const inset = 4
    const isTop = this.opts.position.startsWith('top')
    const isRight = this.opts.position.endsWith('right')
    const top = isTop
      ? view.scrollY + rect.top + inset
      : view.scrollY + rect.bottom - tbHeight - inset
    const left = isRight
      ? view.scrollX + rect.right - tbWidth - inset
      : view.scrollX + rect.left + inset
    this.toolbar.style.top = `${top}px`
    this.toolbar.style.left = `${left}px`
    this.toolbar.style.right = 'auto'
  }

  private clearActive(): void {
    this.doc
      .querySelectorAll('.better-editor-active')
      .forEach((node) => node.classList.remove('better-editor-active'))
  }

  private showFor(el: HTMLElement): void {
    const blockId = el.getAttribute('data-better-editor-id')
    if (!blockId) return
    this.currentBlockId = blockId
    this.currentBlockEl = el
    // Mark the leaf + every ancestor block so outlines stay visible
    // when the cursor moves to the toolbar (toolbar lives in body,
    // outside the block tree, so :hover propagation doesn't apply).
    this.clearActive()
    let cur: HTMLElement | null = el
    while (cur) {
      cur.classList.add('better-editor-active')
      cur = cur.parentElement?.closest<HTMLElement>('[data-better-editor-id]') ?? null
    }
    // Toolbar matches the outline color: top-level vs nested.
    const isNested = !!el.parentElement?.closest('[data-better-editor-id]')
    this.toolbar.style.background = isNested ? this.opts.nestedColor : this.opts.topColor
    this.toolbar.classList.add('is-visible')
    // Wait for layout so offsetWidth reflects the freshly-injected DOM.
    const view = this.doc.defaultView
    if (view) {
      view.requestAnimationFrame(() => this.positionToolbar())
    } else {
      this.positionToolbar()
    }
  }

  private hide(): void {
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    this.toolbar.classList.remove('is-visible')
  }
}
