import { describe, expect, it } from 'vitest'
import { splitFieldPath } from '../../src/internal/path'

describe('splitFieldPath', () => {
  it('splits a normal blocks-row path', () => {
    expect(splitFieldPath('layout.0')).toEqual({ parent: 'layout', index: 0 })
    expect(splitFieldPath('layout.7')).toEqual({ parent: 'layout', index: 7 })
  })

  it('splits a deeply nested path', () => {
    expect(splitFieldPath('layout.0.columns.2')).toEqual({
      parent: 'layout.0.columns',
      index: 2,
    })
  })

  it('returns null when there is no dot', () => {
    expect(splitFieldPath('layout')).toBeNull()
    expect(splitFieldPath('')).toBeNull()
  })

  it('returns null when the trailing segment is not a non-negative integer', () => {
    expect(splitFieldPath('layout.abc')).toBeNull()
    expect(splitFieldPath('layout.-1')).toBeNull()
    expect(splitFieldPath('layout.')).toBeNull()
  })

  it('only splits on the last dot (so x.1.5 keeps x.1 as the parent)', () => {
    expect(splitFieldPath('layout.1.5')).toEqual({ parent: 'layout.1', index: 5 })
  })
})
