import { describe, expect, it } from 'vitest'
import type { FormState } from 'payload'
import { collectFieldErrors, toBlockPath } from '../../src/admin/sidebar/validation'

describe('toBlockPath', () => {
  it('resolves a direct block field to its top-level block', () => {
    expect(toBlockPath('layout.2.title', 'layout')).toBe('layout.2')
  })

  it('resolves a deeply nested field to its top-level block', () => {
    expect(toBlockPath('layout.2.columns.0.text', 'layout')).toBe('layout.2')
  })

  it('returns null for fields outside the blocks field', () => {
    expect(toBlockPath('slug', 'layout')).toBeNull()
    expect(toBlockPath('meta.title', 'layout')).toBeNull()
  })

  it('returns null when the second segment is not an index', () => {
    expect(toBlockPath('layout.hero.title', 'layout')).toBeNull()
  })

  it('honours a custom blocks field name', () => {
    expect(toBlockPath('content.0.heading', 'content')).toBe('content.0')
  })
})

describe('collectFieldErrors', () => {
  const fields = {
    'layout.0.title': { valid: false, errorMessage: 'Required' },
    'layout.1.url': { valid: false, errorMessage: 'Invalid URL' },
    'layout.0.body': { valid: true },
    slug: { valid: false, errorMessage: 'Required' },
    layout: { valid: false, rows: [{ id: 'a' }, { id: 'b' }] }, // container, no message
    meta: { valid: false }, // group, no message
    'meta.title': { value: 'ok' },
  } as unknown as FormState

  it('collects only invalid fields that carry a message, skipping containers and groups', () => {
    const errors = collectFieldErrors(fields, 'layout')
    expect(errors.map((e) => e.path)).toEqual(['layout.0.title', 'layout.1.url', 'slug'])
  })

  it('derives label, message, and block path', () => {
    const errors = collectFieldErrors(fields, 'layout')
    expect(errors[0]).toEqual({
      path: 'layout.0.title',
      label: 'title',
      message: 'Required',
      blockPath: 'layout.0',
    })
    // Non-block field → not clickable.
    expect(errors[2].blockPath).toBeNull()
  })
})
