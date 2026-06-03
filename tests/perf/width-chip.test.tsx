// @vitest-environment jsdom
// WidthChip reads the iframe's clientWidth and reflects it on each resize tick,
// driven here by a stubbed ResizeObserver.

import React, { type RefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { WidthChip } from '../../src/admin/WidthChip'

let notify: (() => void) | null = null

class StubResizeObserver {
  constructor(cb: () => void) {
    notify = cb
  }
  observe(): void {}
  disconnect(): void {
    notify = null
  }
}

vi.stubGlobal('ResizeObserver', StubResizeObserver)

afterEach(() => {
  cleanup()
  notify = null
})

/** A fake iframe whose clientWidth the test can change between resize ticks. */
const fakeIframeRef = (initial: number | null): RefObject<HTMLIFrameElement | null> => {
  if (initial === null) return { current: null }
  const el = document.createElement('iframe')
  let value = initial
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => value })
  ;(el as unknown as { setWidth: (n: number) => void }).setWidth = (n) => {
    value = n
  }
  return { current: el }
}

describe('WidthChip', () => {
  it('renders the rounded iframe width and updates on a resize tick', () => {
    const ref = fakeIframeRef(1024)
    const { container } = render(<WidthChip iframeRef={ref} />)
    expect(container.textContent).toBe('1024px')

    ;(ref.current as unknown as { setWidth: (n: number) => void }).setWidth(801)
    act(() => notify?.())

    expect(container.textContent).toBe('801px')
  })

  it('renders nothing when the iframe has no measurable width', () => {
    const { container } = render(<WidthChip iframeRef={fakeIframeRef(null)} />)
    expect(container.textContent).toBe('')
  })
})
