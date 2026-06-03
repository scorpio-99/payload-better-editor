// @vitest-environment jsdom
// Guards the resize-drag RAF coalescing: a mousemove burst collapses to one
// render per frame, with the final position flushed on mouseup.

import React, { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { usePreviewHandleDrag } from '../../src/hooks/usePreviewHandleDrag'
import { useSidebarResize } from '../../src/hooks/useSidebarResize'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

// requestAnimationFrame as a manually-pumped queue: count scheduled frames and
// flush them on demand. cancelAnimationFrame drops a still-queued callback.
const installControllableRaf = () => {
  const callbacks = new Map<number, FrameRequestCallback>()
  let nextId = 1
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = nextId++
    callbacks.set(id, cb)
    return id
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    callbacks.delete(id as number)
  })
  return {
    scheduledFrames: () => callbacks.size,
    flush: () => {
      const pending = [...callbacks.values()]
      callbacks.clear()
      act(() => {
        for (const cb of pending) cb(0)
      })
    },
  }
}

// Increasing clientX so each move resolves to a distinct (un-deduped) width.
const dragAcross = (count: number, startX = 100): void => {
  for (let i = 1; i <= count; i++) {
    fireEvent.mouseMove(window, { clientX: startX + i })
  }
}

describe('preview responsive-drag coalescing', () => {
  it('collapses a mousemove burst into one render per frame', () => {
    const raf = installControllableRaf()
    let renders = 0
    const onResize = vi.fn()

    const Harness: React.FC = () => {
      renders++
      const [width, setWidth] = useState(600)
      const { onHandleMouseDown } = usePreviewHandleDrag({
        resizable: true,
        viewportWidth: width,
        onResize: (next) => {
          onResize(next)
          setWidth(next)
        },
      })
      return <div data-testid="handle" onMouseDown={onHandleMouseDown('right')} />
    }

    render(<Harness />)
    fireEvent.mouseDown(screen.getByTestId('handle'), { clientX: 100 })
    const rendersBeforeDrag = renders

    dragAcross(20)
    expect(onResize).toHaveBeenCalledTimes(0)
    expect(renders - rendersBeforeDrag).toBe(0)
    expect(raf.scheduledFrames()).toBe(1)

    // 'right' handle dir +2: last clientX 120 → 600 + (120-100)*2 = 640.
    raf.flush()
    expect(onResize).toHaveBeenCalledTimes(1)
    expect(onResize).toHaveBeenLastCalledWith(640)
    expect(renders - rendersBeforeDrag).toBe(1)

    fireEvent.mouseUp(window)
  })

  it('flushes the final position on mouseup without waiting for a frame', () => {
    const raf = installControllableRaf()
    const onResize = vi.fn()

    const Harness: React.FC = () => {
      const [width, setWidth] = useState(600)
      const { onHandleMouseDown } = usePreviewHandleDrag({
        resizable: true,
        viewportWidth: width,
        onResize: (next) => {
          onResize(next)
          setWidth(next)
        },
      })
      return <div data-testid="handle" onMouseDown={onHandleMouseDown('right')} />
    }

    render(<Harness />)
    fireEvent.mouseDown(screen.getByTestId('handle'), { clientX: 100 })

    // Trailing burst, no frame, then release — the pending value must still
    // flush. 646 = 600 + (123-100)*2.
    dragAcross(3, 120)
    expect(onResize).toHaveBeenCalledTimes(0)
    fireEvent.mouseUp(window)

    expect(onResize).toHaveBeenCalledTimes(1)
    expect(onResize).toHaveBeenLastCalledWith(646)
    expect(raf.scheduledFrames()).toBe(0)
  })
})

describe('sidebar-drag coalescing', () => {
  it('collapses a mousemove burst into one render per frame', () => {
    const raf = installControllableRaf()
    let renders = 0

    const Harness: React.FC = () => {
      renders++
      // 'left' so dir = +1: increasing clientX grows the width within [250,800].
      const { onResizeStart } = useSidebarResize('left')
      return <div data-testid="handle" onMouseDown={onResizeStart} />
    }

    render(<Harness />)
    fireEvent.mouseDown(screen.getByTestId('handle'), { clientX: 100 })
    const rendersBeforeDrag = renders

    dragAcross(20)
    expect(renders - rendersBeforeDrag).toBe(0)
    expect(raf.scheduledFrames()).toBe(1)

    raf.flush()
    expect(renders - rendersBeforeDrag).toBe(1)

    fireEvent.mouseUp(window)
  })
})
