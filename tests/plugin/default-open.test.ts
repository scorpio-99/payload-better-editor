import type { Config } from 'payload'
import { describe, expect, it } from 'vitest'
import { betterEditor } from '../../src/index'

describe('defaultOpen', () => {
  it('passes defaultOpen to the toggle only when enabled', () => {
    const config = betterEditor({ collections: { pages: { defaultOpen: true }, posts: {} } })({
      collections: [
        { slug: 'pages', fields: [{ name: 'layout', type: 'blocks', blocks: [] }] },
        { slug: 'posts', fields: [{ name: 'layout', type: 'blocks', blocks: [] }] },
      ],
    } as unknown as Config)
    const toggleProps = (slug: string) =>
      (
        config.collections?.find((c) => c.slug === slug)?.admin?.components?.edit
          ?.beforeDocumentControls as Array<{ clientProps: Record<string, unknown> }>
      )[0].clientProps
    expect(toggleProps('pages').defaultOpen).toBe(true)
    expect('defaultOpen' in toggleProps('posts')).toBe(false)
  })
})
