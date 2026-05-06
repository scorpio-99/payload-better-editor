import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import { ACTIVE_CLASS, BLOCK_ID_ATTR, BLOCK_ID_SELECTOR } from '../internal/constants'
import type { BlockActionMessage } from './protocol'
import { TOOLBAR_ID } from './hover-css'
import { HoverToolbar } from './HoverToolbar'

export type HoverToolbarOptions = {
  position: HoverToolbarPosition
  onAction: (id: string, action: BlockActionMessage['action']) => void
}

const TOOLBAR_INSET = 4
// Used during the first showFor before the toolbar has laid out and
// reported a real offsetWidth/Height. Picked to roughly match the
// rendered size so the initial flash lands close to the final spot.
const FALLBACK_TB_WIDTH = 120
const FALLBACK_TB_HEIGHT = 32

export class HoverToolbarController {
  private readonly doc: Document
  private opts: HoverToolbarOptions
  private readonly toolbar: HTMLDivElement
  private readonly root: Root
  private destroyed = false
  private currentBlockId: string | null = null
  private currentBlockEl: HTMLElement | null = null
  private activeChain: HTMLElement[] = []
  private positionRaf = 0
  private readonly onMove: (e: MouseEvent) => void
  private readonly onScroll: () => void

  constructor(doc: Document, opts: HoverToolbarOptions) {
    this.doc = doc
    this.opts = opts

    doc.getElementById(TOOLBAR_ID)?.remove()
    const toolbar = doc.createElement('div')
    toolbar.id = TOOLBAR_ID
    doc.body.appendChild(toolbar)
    this.toolbar = toolbar

    this.root = createRoot(toolbar)
    this.root.render(
      React.createElement(HoverToolbar, {
        onAction: (action) => {
          if (this.currentBlockId) this.opts.onAction(this.currentBlockId, action)
        },
      }),
    )

    this.onMove = (e) => {
      // `instanceof Element` is realm-local; Elements from the iframe
      // document fail the parent-realm check. Duck-type via `closest` instead.
      const target = e.target as Element | null
      if (!target || typeof target.closest !== 'function') return
      if (this.toolbar.contains(target)) return
      const el = target.closest<HTMLElement>(BLOCK_ID_SELECTOR)
      if (!el) {
        this.hide()
        return
      }
      // Re-bind on stale ref: the previous block element may have been
      // replaced by React even though the new one matches the same selector.
      if (el === this.currentBlockEl && el.isConnected) return
      this.showFor(el)
    }

    this.onScroll = () => this.positionToolbar()

    doc.addEventListener('mouseover', this.onMove)
    doc.defaultView?.addEventListener('scroll', this.onScroll, true)
  }

  update(opts: HoverToolbarOptions): void {
    this.opts = opts
    if (this.currentBlockEl) this.positionToolbar()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.doc.removeEventListener('mouseover', this.onMove)
    this.doc.defaultView?.removeEventListener('scroll', this.onScroll, true)
    if (this.positionRaf) {
      this.doc.defaultView?.cancelAnimationFrame(this.positionRaf)
      this.positionRaf = 0
    }
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    // React 19 throws if root.unmount() runs synchronously while another
    // tree is mid-render; defer so it lands after the parent commit.
    const { root, toolbar } = this
    queueMicrotask(() => {
      try {
        root.unmount()
      } catch {
        /* root already unmounted */
      }
      toolbar.remove()
    })
  }

  private positionToolbar(): void {
    const el = this.currentBlockEl
    if (!el || !el.isConnected) return
    const view = this.doc.defaultView
    if (!view) return
    const rect = el.getBoundingClientRect()
    const tbWidth = this.toolbar.offsetWidth || FALLBACK_TB_WIDTH
    const tbHeight = this.toolbar.offsetHeight || FALLBACK_TB_HEIGHT
    const isTop = this.opts.position.startsWith('top')
    const isRight = this.opts.position.endsWith('right')
    const top = isTop
      ? view.scrollY + rect.top + TOOLBAR_INSET
      : view.scrollY + rect.bottom - tbHeight - TOOLBAR_INSET
    const left = isRight
      ? view.scrollX + rect.right - tbWidth - TOOLBAR_INSET
      : view.scrollX + rect.left + TOOLBAR_INSET
    const { style } = this.toolbar
    style.top = `${top}px`
    style.left = `${left}px`
    style.right = 'auto'
  }

  // Targeted clear (only nodes we marked) avoids a full-document
  // querySelectorAll on every hover transition.
  private clearActive(): void {
    for (const node of this.activeChain) node.classList.remove(ACTIVE_CLASS)
    this.activeChain = []
  }

  private showFor(el: HTMLElement): void {
    const blockId = el.getAttribute(BLOCK_ID_ATTR)
    if (!blockId) return
    this.clearActive()
    this.currentBlockId = blockId
    this.currentBlockEl = el
    // Mark leaf + ancestors so outlines persist when the cursor moves
    // onto the toolbar (toolbar lives in body, no :hover propagation).
    const chain: HTMLElement[] = []
    for (
      let cur: HTMLElement | null = el;
      cur;
      cur = cur.parentElement?.closest<HTMLElement>(BLOCK_ID_SELECTOR) ?? null
    ) {
      cur.classList.add(ACTIVE_CLASS)
      chain.push(cur)
    }
    this.activeChain = chain
    const isNested = chain.length > 1
    this.toolbar.dataset.nested = isNested ? '1' : '0'
    this.toolbar.classList.add('is-visible')
    const view = this.doc.defaultView
    if (view) {
      if (this.positionRaf) view.cancelAnimationFrame(this.positionRaf)
      this.positionRaf = view.requestAnimationFrame(() => {
        this.positionRaf = 0
        this.positionToolbar()
      })
    } else {
      this.positionToolbar()
    }
  }

  private hide(): void {
    if (!this.currentBlockEl) return
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    this.toolbar.classList.remove('is-visible')
  }
}
