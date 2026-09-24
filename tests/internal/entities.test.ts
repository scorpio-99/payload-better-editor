import { describe, expect, it } from 'vitest'
import { normalizeEntities } from '../../src/internal/entities'

describe('normalizeEntities', () => {
  it('maps a slug array to the default blocksField', () => {
    const m = normalizeEntities(['pages', 'articles'], 'layout')
    expect(m.get('pages')).toEqual({ blocksField: 'layout', defaultOpen: false })
    expect(m.get('articles')).toEqual({ blocksField: 'layout', defaultOpen: false })
    expect(m.size).toBe(2)
  })

  it('maps a record with per-slug overrides, falling back to the default', () => {
    const m = normalizeEntities({ pages: { blocksField: 'content' }, articles: {} }, 'layout')
    expect(m.get('pages')?.blocksField).toBe('content')
    expect(m.get('articles')?.blocksField).toBe('layout')
  })

  it('carries per-slug defaultOpen, defaulting to false', () => {
    const m = normalizeEntities({ pages: { defaultOpen: true }, articles: {} }, 'layout')
    expect(m.get('pages')?.defaultOpen).toBe(true)
    expect(m.get('articles')?.defaultOpen).toBe(false)
  })

  it('returns an empty map for undefined', () => {
    expect(normalizeEntities(undefined, 'layout').size).toBe(0)
  })
})
