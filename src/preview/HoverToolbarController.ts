import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { HoverToolbarPosition } from '../internal/constants'
import { ACTIVE_CLASS, BLOCK_ID_ATTR, BLOCK_ID_SELECTOR } from '../internal/dom'
import type { BlockActionMessage } from './protocol'
import { TOOLBAR_ID } from './hover-css'
import { HoverToolbar, type HoverToolbarLabels } from './HoverToolbar'
import { calculateToolbarPosition } from './toolbar-position'

export type HoverToolbarOptions = {
  position: HoverToolbarPosition
  outlineWidth: number
  onAction: (id: string, action: BlockActionMessage['action']) => void
  labels: HoverToolbarLabels
}

export type { HoverToolbarLabels }

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
  private observerRaf = 0
  private readonly onScroll: () => void
  private readonly observer: MutationObserver

  constructor(doc: Document, opts: HoverToolbarOptions) {
    this.doc = doc
    this.opts = opts

    doc.getElementById(TOOLBAR_ID)?.remove()
    const toolbar = doc.createElement('div')
    toolbar.id = TOOLBAR_ID
    doc.body.appendChild(toolbar)
    this.toolbar = toolbar

    this.root = createRoot(toolbar)
    this.renderToolbar()

    this.onScroll = () => this.scheduleReposition()
    doc.defaultView?.addEventListener('scroll', this.onScroll, true)

    this.observer = new MutationObserver(() => {
      if (this.destroyed || !this.currentBlockId) return
      // Coalesce mutation bursts into a single re-select on the next paint.
      // Re-using positionRaf avoids the previous two-tier RAF pyramid.
      this.scheduleReselect()
    })
    this.observer.observe(doc.body, { childList: true, subtree: true })
  }

  private scheduleReselect(): void {
    const view = this.doc.defaultView
    if (!view || this.observerRaf) return
    this.observerRaf = view.requestAnimationFrame(() => {
      this.observerRaf = 0
      if (this.destroyed || !this.currentBlockId) return
      this.select(this.currentBlockId)
    })
  }

  update(opts: HoverToolbarOptions): void {
    this.opts = opts
    this.renderToolbar()
    if (this.currentBlockEl) this.scheduleReposition()
  }

  private renderToolbar(): void {
    this.root.render(
      React.createElement(HoverToolbar, {
        labels: this.opts.labels,
        onAction: (action) => {
          if (this.currentBlockId) this.opts.onAction(this.currentBlockId, action)
        },
      }),
    )
  }

  select(id: string): void {
    if (this.destroyed) return
    const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, '\\$&')
    const el = this.doc.querySelector<HTMLElement>(`[${BLOCK_ID_ATTR}="${escaped}"]`)
    if (!el) {
      // Block not in DOM (yet) — keep id but hide the toolbar; a later
      // select(id) call after the iframe re-render will resolve it.
      this.currentBlockId = id
      this.currentBlockEl = null
      this.clearActive()
      this.toolbar.classList.remove('is-visible')
      return
    }
    this.currentBlockId = id
    this.currentBlockEl = el
    this.markActiveChain(el)
    const isNested = this.activeChain.length > 1
    this.toolbar.dataset.nested = isNested ? '1' : '0'
    this.toolbar.classList.add('is-visible')
    this.scheduleReposition()
  }

  deselect(): void {
    if (this.destroyed) return
    if (!this.currentBlockId) return
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    this.toolbar.classList.remove('is-visible')
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.observer.disconnect()
    const view = this.doc.defaultView
    view?.removeEventListener('scroll', this.onScroll, true)
    if (this.positionRaf) view?.cancelAnimationFrame(this.positionRaf)
    if (this.observerRaf) view?.cancelAnimationFrame(this.observerRaf)
    this.positionRaf = 0
    this.observerRaf = 0
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    // Defer unmount — React 19 throws if it lands synchronously mid-render of
    // another tree; StrictMode also double-invokes us, so only remove the
    // toolbar node if we still own it.
    const { root, toolbar } = this
    queueMicrotask(() => {
      try { root.unmount() } catch { /* already unmounted */ }
      if (toolbar.isConnected) toolbar.remove()
    })
  }

  private scheduleReposition(): void {
    const view = this.doc.defaultView
    if (!view) {
      this.positionToolbar()
      return
    }
    if (this.positionRaf) view.cancelAnimationFrame(this.positionRaf)
    this.positionRaf = view.requestAnimationFrame(() => {
      this.positionRaf = 0
      this.positionToolbar()
    })
  }

  private positionToolbar(): void {
    const el = this.currentBlockEl
    if (!el || !el.isConnected) return
    const view = this.doc.defaultView
    if (!view) return
    const { top, left } = calculateToolbarPosition(
      el.getBoundingClientRect(),
      {
        width: this.toolbar.offsetWidth || FALLBACK_TB_WIDTH,
        height: this.toolbar.offsetHeight || FALLBACK_TB_HEIGHT,
      },
      { scrollX: view.scrollX, scrollY: view.scrollY },
      this.opts.position,
      this.opts.outlineWidth,
    )
    const { style } = this.toolbar
    style.top = `${top}px`
    style.left = `${left}px`
    style.right = 'auto'
  }

  // Only clears the chain we marked, avoiding a full-document scan.
  private clearActive(): void {
    for (const node of this.activeChain) node.classList.remove(ACTIVE_CLASS)
    this.activeChain = []
  }

  private markActiveChain(el: HTMLElement): void {
    this.clearActive()
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
  }
}
