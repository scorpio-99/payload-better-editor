import { describe, expect, it } from 'vitest'
import type { ClientBlock } from 'payload'
import { resolveFieldBlocks } from '../../../src/admin/blocks/schema'

const hero = { slug: 'hero' } as ClientBlock
const content = { slug: 'content' } as ClientBlock

describe('resolveFieldBlocks', () => {
  it('returns inline blocks when there are no blockReferences', () => {
    expect(resolveFieldBlocks({ blocks: [hero] }, undefined)).toEqual([hero])
  })

  it('resolves blockReferences slugs via the blocksMap', () => {
    expect(
      resolveFieldBlocks({ blocks: [], blockReferences: ['hero', 'content'] }, { hero, content }),
    ).toEqual([hero, content])
  })

  it('accepts inline block objects inside blockReferences', () => {
    expect(resolveFieldBlocks({ blockReferences: [hero] }, {})).toEqual([hero])
  })

  it('skips reference slugs missing from the blocksMap', () => {
    expect(resolveFieldBlocks({ blockReferences: ['hero', 'missing'] }, { hero })).toEqual([hero])
  })

  it('returns [] when blocks is undefined and there are no references', () => {
    expect(resolveFieldBlocks({}, undefined)).toEqual([])
  })
})
