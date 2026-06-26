// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HoverToolbar, type HoverToolbarLabels } from '../../src/preview/HoverToolbar'

afterEach(cleanup)

const LABELS: HoverToolbarLabels = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  duplicate: 'Duplicate',
  addBelow: 'Add block below',
  delete: 'Delete',
}

const GERMAN_LABELS: HoverToolbarLabels = {
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',
  duplicate: 'Duplizieren',
  addBelow: 'Block darunter einfügen',
  delete: 'Löschen',
}

describe('HoverToolbar', () => {
  it('renders one button per action', () => {
    render(<HoverToolbar onAction={vi.fn()} labels={LABELS} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('uses labels from props for aria-label and title', () => {
    render(<HoverToolbar onAction={vi.fn()} labels={LABELS} />)
    for (const label of Object.values(LABELS)) {
      const btn = screen.getByRole('button', { name: label })
      expect(btn).toBeDefined()
      expect(btn.getAttribute('title')).toBe(label)
    }
  })

  it('reflects translated labels when different labels are passed', () => {
    render(<HoverToolbar onAction={vi.fn()} labels={GERMAN_LABELS} />)
    expect(screen.getByRole('button', { name: 'Nach oben' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Move up' })).toBeNull()
  })

  it('calls onAction with the correct action when a button is clicked', () => {
    const onAction = vi.fn()
    render(<HoverToolbar onAction={onAction} labels={LABELS} />)

    fireEvent.click(screen.getByRole('button', { name: 'Move up' }))
    expect(onAction).toHaveBeenCalledWith('move-up')

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onAction).toHaveBeenCalledWith('delete')

    expect(onAction).toHaveBeenCalledTimes(2)
  })

  it('stops propagation on click', () => {
    const parentHandler = vi.fn()
    const onAction = vi.fn()
    render(
      <div onClick={parentHandler}>
        <HoverToolbar onAction={onAction} labels={LABELS} />
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }))
    expect(onAction).toHaveBeenCalledOnce()
    expect(parentHandler).not.toHaveBeenCalled()
  })
})
