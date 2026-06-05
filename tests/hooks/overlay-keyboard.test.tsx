// @vitest-environment jsdom
// Escape stays inert (#18); Cmd/Ctrl+Z / +Shift+Z / +Y drive undo/redo.

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useOverlayKeyboard } from '../../src/hooks/useOverlayKeyboard'

const makeHistory = () => ({
  pushSnapshot: vi.fn(),
  commit: vi.fn((m: () => void) => m()),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: true,
  canRedo: true,
  mutationToken: 0,
})

let history: ReturnType<typeof makeHistory>

const Host: React.FC = () => {
  useOverlayKeyboard({ history })
  return null
}

const press = (key: string, mods: Partial<KeyboardEventInit> = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...mods }))
}

beforeEach(() => {
  history = makeHistory()
  render(<Host />)
})

afterEach(() => {
  cleanup()
})

describe('useOverlayKeyboard', () => {
  it('treats Escape as a no-op — never closes or mutates history', () => {
    press('Escape')
    expect(history.undo).not.toHaveBeenCalled()
    expect(history.redo).not.toHaveBeenCalled()
  })

  it('undoes on Cmd/Ctrl+Z', () => {
    press('z', { metaKey: true })
    expect(history.undo).toHaveBeenCalledTimes(1)
    press('z', { ctrlKey: true })
    expect(history.undo).toHaveBeenCalledTimes(2)
    expect(history.redo).not.toHaveBeenCalled()
  })

  it('redoes on Cmd+Shift+Z and Cmd+Y', () => {
    press('z', { metaKey: true, shiftKey: true })
    press('y', { metaKey: true })
    expect(history.redo).toHaveBeenCalledTimes(2)
    expect(history.undo).not.toHaveBeenCalled()
  })

  it('ignores plain keys without a modifier', () => {
    press('z')
    expect(history.undo).not.toHaveBeenCalled()
    expect(history.redo).not.toHaveBeenCalled()
  })
})
