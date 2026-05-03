import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import { ACTIVE_CLASS, ACTIVE_SELECTOR, BLOCK_ID_ATTR, BLOCK_ID_SELECTOR } from '../internal/constants'
import type { BlockActionMessage } from './protocol'
import { TOOLBAR_ID } from './hover-css'
import { HoverToolbar } from './HoverToolbar'

export type HoverToolbarOptions = {
  position: HoverToolbarPosition
  onAction: (id: string, action: BlockActionMessage['action']) => void
}

export class HoverToolbarController {
  private doc: Document
  private opts: HoverToolbarOptions
  private toolbar: HTMLDivElement
  private root: Root
  private destroyed = false
  private currentBlockId: string | null = null
  private currentBlockEl: HTMLElement | null = null
  private onMove: (e: MouseEvent) => void
  private onScroll: () => void

  constructor(doc: Document, opts: HoverToolbarOptions) {
    this.doc = doc
    this.opts = opts

    let toolbar = doc.getElementById(TOOLBAR_ID) as HTMLDivElement | null
    if (toolbar) toolbar.remove()
    toolbar = doc.createElement('div')
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

    this.onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
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

    this.doc.addEventListener('mouseover', this.onMove)
    this.doc.defaultView?.addEventListener('scroll', this.onScroll, true)
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
    // React 19 throws if root.unmount() runs synchronously while another
    // tree is mid-render; defer so it lands after the parent commit.
    const root = this.root
    const toolbar = this.toolbar
    queueMicrotask(() => {
      try {
        root.unmount()
      } catch {
        /* root already unmounted */
      }
      if (toolbar.parentNode) toolbar.parentNode.removeChild(toolbar)
    })
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
    let cur: HTMLElement | null = el
    while (cur) {
      cur.classList.add(ACTIVE_CLASS)
      cur = cur.parentElement?.closest<HTMLElement>(BLOCK_ID_SELECTOR) ?? null
    }
    const isNested = !!el.parentElement?.closest(BLOCK_ID_SELECTOR)
    this.toolbar.dataset.nested = isNested ? '1' : '0'
    this.toolbar.classList.add('is-visible')
    const view = this.doc.defaultView
    if (view) view.requestAnimationFrame(() => this.positionToolbar())
    else this.positionToolbar()
  }

  private hide(): void {
    this.clearActive()
    this.currentBlockId = null
    this.currentBlockEl = null
    this.toolbar.classList.remove('is-visible')
  }
}
