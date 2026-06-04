import { describe, expect, it } from 'vitest'
import { normalizeEntities } from '../../src/internal/entities'

describe('normalizeEntities', () => {
  it('maps a slug array to the default blocksField', () => {
    const m = normalizeEntities(['pages', 'articles'], 'layout')
    expect(m.get('pages')).toBe('layout')
    expect(m.get('articles')).toBe('layout')
    expect(m.size).toBe(2)
  })

  it('maps a record with per-slug overrides, falling back to the default', () => {
    const m = normalizeEntities({ pages: { blocksField: 'content' }, articles: {} }, 'layout')
    expect(m.get('pages')).toBe('content')
    expect(m.get('articles')).toBe('layout')
  })

  it('returns an empty map for undefined', () => {
    expect(normalizeEntities(undefined, 'layout').size).toBe(0)
  })
})
