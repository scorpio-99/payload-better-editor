'use client'

import React, { useCallback, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, CopyIcon, PlusIcon, TrashIcon } from '../icons'

export type BlockActionsToolbarProps = {
  canMoveUp: boolean
  canMoveDown: boolean
  /** When false the toolbar renders nothing. */
  canMutate: boolean
  /** When false the "Add below" button is disabled (no parent blocks list). */
  canAddBelow: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onAddBelow: () => void
  onDelete: () => void
}

export const BlockActionsToolbar: React.FC<BlockActionsToolbarProps> = ({
  canMoveUp,
  canMoveDown,
  canMutate,
  canAddBelow,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddBelow,
  onDelete,
}) => {
  // Roving tabindex per WAI-ARIA toolbar pattern: only one button is in
  // the tab sequence; arrow keys move focus among siblings.
  const [focusIdx, setFocusIdx] = useState(0)
  const btnsRef = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') {
      return
    }
    e.preventDefault()
    const buttons = btnsRef.current.filter((b): b is HTMLButtonElement => b !== null)
    if (buttons.length === 0) return
    const current = buttons.findIndex((b) => b === document.activeElement)
    const start = current === -1 ? 0 : current
    let next = start
    if (e.key === 'ArrowLeft') next = (start - 1 + buttons.length) % buttons.length
    else if (e.key === 'ArrowRight') next = (start + 1) % buttons.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = buttons.length - 1
    buttons[next].focus()
    const idx = btnsRef.current.indexOf(buttons[next])
    if (idx >= 0) setFocusIdx(idx)
  }, [])

  if (!canMutate) return null

  const setRef = (i: number) => (el: HTMLButtonElement | null) => {
    btnsRef.current[i] = el
  }
  const tabIndexFor = (i: number) => (i === focusIdx ? 0 : -1)
  const onFocus = (i: number) => () => setFocusIdx(i)

  return (
    <div
      className="better-editor-tab__actions"
      role="toolbar"
      aria-label="Block actions"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        ref={setRef(0)}
        tabIndex={tabIndexFor(0)}
        onFocus={onFocus(0)}
        className="better-editor-tab__action"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Move up"
        aria-label="Move block up"
      >
        <ChevronUp />
      </button>
      <button
        type="button"
        ref={setRef(1)}
        tabIndex={tabIndexFor(1)}
        onFocus={onFocus(1)}
        className="better-editor-tab__action"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Move down"
        aria-label="Move block down"
      >
        <ChevronDown />
      </button>
      <button
        type="button"
        ref={setRef(2)}
        tabIndex={tabIndexFor(2)}
        onFocus={onFocus(2)}
        className="better-editor-tab__action"
        onClick={onDuplicate}
        title="Duplicate"
        aria-label="Duplicate block"
      >
        <CopyIcon />
      </button>
      <button
        type="button"
        ref={setRef(3)}
        tabIndex={tabIndexFor(3)}
        onFocus={onFocus(3)}
        className="better-editor-tab__action"
        onClick={onAddBelow}
        disabled={!canAddBelow}
        title="Add block below"
        aria-label="Add block below"
      >
        <PlusIcon />
      </button>
      <button
        type="button"
        ref={setRef(4)}
        tabIndex={tabIndexFor(4)}
        onFocus={onFocus(4)}
        className="better-editor-tab__action better-editor-tab__action--danger"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete block"
      >
        <TrashIcon />
      </button>
    </div>
  )
}
