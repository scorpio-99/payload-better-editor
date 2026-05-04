import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import {
  ACTIVE_CLASS,
  ACTIVE_SELECTOR,
  BLOCK_ID_ATTR,
  BLOCK_ID_SELECTOR,
} from '../internal/constants'
import type { BlockActionMessage } from './protocol'
import { TOOLBAR_ID } from './hover-css'
import { HoverToolbar } from './HoverToolbar'

export type HoverToolbarOptions = {
  position: HoverToolbarPosition
  onAction: (id: string, action: BlockActionMessage['action']) => void
}

const TOOLBAR_INSET = 4
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
      const target = e.target
      if (!(target instanceof Element)) return
      if (this.toolbar.contains(target)) return
      const el = target.closest<HTMLElement>(BLOCK_ID_SELECTOR)
      if (!el) {
        this.hide()
        return
      }
      if (el === this.currentBlockEl) return
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

  private clearActive(): void {
    this.doc.querySelectorAll(ACTIVE_SELECTOR).forEach((node) => node.classList.remove(ACTIVE_CLASS))
  }

  private showFor(el: HTMLElement): void {
    const blockId = el.getAttribute(BLOCK_ID_ATTR)
    if (!blockId) return
    this.currentBlockId = blockId
    this.currentBlockEl = el
    // Mark leaf + ancestors so outlines persist when the cursor moves
    // onto the toolbar (toolbar lives in body, no :hover propagation).
    this.clearActive()
    for (
      let cur: HTMLElement | null = el;
      cur;
      cur = cur.parentElement?.closest<HTMLElement>(BLOCK_ID_SELECTOR) ?? null
    ) {
      cur.classList.add(ACTIVE_CLASS)
    }
    const isNested = !!el.parentElement?.closest(BLOCK_ID_SELECTOR)
    this.toolbar.dataset.nested = isNested ? '1' : '0'
    this.toolbar.classList.add('is-visible')
    const view = this.doc.defaultView
    if (view) view.requestAnimationFrame(() => this.positionToolbar())
    else this.positionToolbar()
  }

  private hide(): void {
    if (!this.currentBlockEl) return
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    this.toolbar.classList.remove('is-visible')
  }
}
