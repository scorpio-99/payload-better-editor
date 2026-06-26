// @vitest-environment jsdom
// Guards that Sidebar is memoized: a parent width change must not re-render it,
// a real prop change must. Tab children are mocked (they need Payload context);
// the active 'page' tab's render count stands in for Sidebar's.

import React, { useCallback, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'

const counters = vi.hoisted(() => ({ pageTabRenders: 0 }))

vi.mock('../../src/i18n/useBetterEditorT', async () => {
  const { en } = await import('../../src/i18n/en')
  return { useBetterEditorT: () => en }
})
vi.mock('../../src/admin/sidebar/DocumentSettingsTab', () => ({
  DocumentSettingsTab: () => {
    counters.pageTabRenders++
    return null
  },
}))
vi.mock('../../src/admin/sidebar/DocumentMetaTab', () => ({ DocumentMetaTab: () => null }))
vi.mock('../../src/admin/sidebar/BlockSettingsTab', () => ({ BlockSettingsTab: () => null }))
// Calls useAllFormFields, which needs Payload's form context the harness lacks.
vi.mock('../../src/admin/sidebar/ValidationSummary', () => ({ ValidationSummary: () => null }))

// Imported after the mocks so Sidebar picks up the stubbed tabs.
const { Sidebar } = await import('../../src/admin/sidebar/Sidebar')

let setWidth: (n: number) => void
let setForceFullWidth: (b: boolean) => void

const Parent: React.FC = () => {
  const [width, setWidthState] = useState(400)
  const [forceFullWidthFields, setFfw] = useState(true)
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const clearSelection = useCallback(() => setSelectedBlockPath(null), [])
  setWidth = setWidthState
  setForceFullWidth = setFfw

  // Mirror the overlay: width drives a sibling style; Sidebar's props are stable.
  return (
    <div style={{ width }}>
      <Sidebar
        selectedBlockPath={selectedBlockPath}
        onClearSelection={clearSelection}
        onSelectPath={setSelectedBlockPath}
        forceFullWidthFields={forceFullWidthFields}
        blocksField="layout"
        addBelowRequestId={0}
      />
    </div>
  )
}

beforeEach(() => {
  counters.pageTabRenders = 0
})
afterEach(cleanup)

describe('Sidebar memoization', () => {
  it('does not re-render when only a sibling width changes', () => {
    render(<Parent />)
    expect(counters.pageTabRenders).toBe(1)

    for (let i = 1; i <= 20; i++) act(() => setWidth(400 + i))

    expect(counters.pageTabRenders).toBe(1) // memo skipped all 20 parent renders
  })

  it('still re-renders when an actual prop changes', () => {
    render(<Parent />)
    expect(counters.pageTabRenders).toBe(1)

    act(() => setForceFullWidth(false))

    expect(counters.pageTabRenders).toBe(2) // memo lets real changes through
  })
})
