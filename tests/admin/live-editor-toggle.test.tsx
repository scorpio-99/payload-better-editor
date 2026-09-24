// @vitest-environment jsdom
// The toggle seeds its open state from the user's saved preference, falling
// back to the per-entity `defaultOpen`, and persists only explicit clicks.

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

const getPreference = vi.fn()
const setPreference = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  useDocumentInfo: () => ({ collectionSlug: 'pages' }),
  useLivePreviewContext: () => ({ previewURL: '/preview' }),
  usePreferences: () => ({ getPreference, setPreference }),
  useTranslation: () => ({ i18n: { translations: {} } }),
}))
vi.mock('../../src/admin/LiveEditorOverlay', () => ({ LiveEditorOverlay: () => null }))
vi.mock('../../src/hooks/useMainWrapperPortal', () => ({ useMainWrapperPortal: () => null }))

const { LiveEditorToggle } = await import('../../src/admin/LiveEditorToggle')

const renderToggle = async (defaultOpen?: boolean) => {
  render(<LiveEditorToggle blocksField="layout" defaultOpen={defaultOpen} />)
  await act(async () => {})
  return screen.getByRole('button')
}

beforeEach(() => {
  getPreference.mockReset()
  setPreference.mockReset()
})
afterEach(cleanup)

describe('LiveEditorToggle', () => {
  it('stays closed without a preference or defaultOpen', async () => {
    getPreference.mockResolvedValue(undefined)
    const button = await renderToggle()
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(setPreference).not.toHaveBeenCalled()
  })

  it('opens from defaultOpen without persisting it', async () => {
    getPreference.mockResolvedValue(undefined)
    const button = await renderToggle(true)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(setPreference).not.toHaveBeenCalled()
  })

  it('lets a saved closed preference win over defaultOpen', async () => {
    getPreference.mockResolvedValue({ open: false })
    const button = await renderToggle(true)
    expect(button.getAttribute('aria-pressed')).toBe('false')
  })

  it('restores a saved open preference', async () => {
    getPreference.mockResolvedValue({ open: true })
    const button = await renderToggle()
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  it('persists an explicit toggle', async () => {
    getPreference.mockResolvedValue(undefined)
    const button = await renderToggle(true)
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(setPreference).toHaveBeenCalledWith('better-editor:collection-pages', { open: false }, true)
  })
})
