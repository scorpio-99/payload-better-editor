import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { HoverToolbarPosition } from '../useBetterEditorSettings'
import type { BlockActionMessage } from './protocol'
import { TOOLBAR_ID } from './hover-css'
import { HoverToolbar } from './HoverToolbar'

export type HoverToolbarOptions = {
  position: HoverToolbarPosition
  onAction: (id: string, action: BlockActionMessage['action']) => void
}

/**
 * Floating action toolbar over the hovered block inside the preview
 * iframe. Sticky-leaf selection — when the cursor crosses an ancestor
 * (e.g. the gap between sibling children) the toolbar stays on the
 * current leaf so it doesn't flicker. Colors are CSS-driven via the
 * `--bee-top` / `--bee-nested` custom properties; the toolbar's tint is
 * picked up automatically via the `data-nested` attribute. The button
 * row itself is rendered via React (createRoot) so icons stay fully
 * type-checked components.
 */
export class HoverToolbarController {
  private doc: Document
  private opts: HoverToolbarOptions
  private toolbar: HTMLDivElement
  private root: Root
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
      const el = target.closest<HTMLElement>('[data-better-editor-id]')
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

  /** Reapply position config without recreating the DOM node. */
  update(opts: HoverToolbarOptions): void {
    this.opts = opts
    if (this.currentBlockEl) this.positionToolbar()
  }

  destroy(): void {
    this.doc.removeEventListener('mouseover', this.onMove)
    this.doc.defaultView?.removeEventListener('scroll', this.onScroll, true)
    this.clearActive()
    this.root.unmount()
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
    // Mark leaf + ancestors so outlines persist when the cursor moves
    // onto the toolbar (toolbar lives in body, no :hover propagation).
    this.clearActive()
    let cur: HTMLElement | null = el
    while (cur) {
      cur.classList.add('better-editor-active')
      cur = cur.parentElement?.closest<HTMLElement>('[data-better-editor-id]') ?? null
    }
    const isNested = !!el.parentElement?.closest('[data-better-editor-id]')
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
