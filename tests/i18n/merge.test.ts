import { describe, expect, it } from 'vitest'
import { deepMerge, mergeTranslations } from '../../src/i18n/merge'
import { en } from '../../src/i18n/en'

describe('deepMerge', () => {
  it('returns base when override is empty', () => {
    const base = { a: 1, b: 'x' }
    expect(deepMerge(base as never, {})).toEqual({ a: 1, b: 'x' })
  })

  it('overrides a top-level leaf key', () => {
    const result = deepMerge({ a: 'base', b: 'keep' } as never, { a: 'override' } as never)
    expect(result).toEqual({ a: 'override', b: 'keep' })
  })

  it('deep-merges nested objects', () => {
    const base = { outer: { a: 'base-a', b: 'base-b' } }
    const override = { outer: { a: 'new-a' } }
    expect(deepMerge(base as never, override as never)).toEqual({
      outer: { a: 'new-a', b: 'base-b' },
    })
  })

  it('merges multiple nesting levels', () => {
    const base = { x: { y: { z: 'deep', keep: 'yes' } } }
    const override = { x: { y: { z: 'overridden' } } }
    expect(deepMerge(base as never, override as never)).toEqual({
      x: { y: { z: 'overridden', keep: 'yes' } },
    })
  })

  it('does not merge arrays — treats them as leaf replacements', () => {
    const base = { arr: [1, 2, 3] }
    const override = { arr: [9] }
    expect(deepMerge(base as never, override as never)).toEqual({ arr: [9] })
  })

  it('skips keys whose override value is undefined', () => {
    const result = deepMerge({ a: 'keep' } as never, { a: undefined } as never)
    expect(result).toEqual({ a: 'keep' })
  })

  it('adds keys present in override but missing from base', () => {
    const result = deepMerge({ a: 'x' } as never, { b: 'new' } as never)
    expect(result).toEqual({ a: 'x', b: 'new' })
  })

  it('does not mutate the base object', () => {
    const base = { a: 'original' }
    deepMerge(base as never, { a: 'changed' } as never)
    expect(base.a).toBe('original')
  })

  it('replaces an object in base with a scalar override', () => {
    const base = { nested: { a: 1 } }
    const override = { nested: 'scalar' }
    expect(deepMerge(base as never, override as never)).toEqual({ nested: 'scalar' })
  })
})

describe('mergeTranslations', () => {
  it('returns the built-in translations unchanged when no betterEditor key exists', () => {
    expect(mergeTranslations(en, {})).toEqual(en)
    expect(mergeTranslations(en, null)).toEqual(en)
    expect(mergeTranslations(en, undefined)).toEqual(en)
    expect(mergeTranslations(en, { otherNamespace: {} })).toEqual(en)
  })

  it('overrides a single top-level string key', () => {
    const existing = { betterEditor: { toggle: { open: 'Custom open' } } }
    const result = mergeTranslations(en, existing)
    expect(result.toggle.open).toBe('Custom open')
    expect(result.toggle.close).toBe(en.toggle.close)
  })

  it('overrides a deeply nested key without touching siblings', () => {
    const existing = { betterEditor: { blocks: { actions: { moveUp: 'Up!' } } } }
    const result = mergeTranslations(en, existing)
    expect(result.blocks.actions.moveUp).toBe('Up!')
    expect(result.blocks.actions.moveDown).toBe(en.blocks.actions.moveDown)
    expect(result.blocks.emptyPrompt).toBe(en.blocks.emptyPrompt)
  })

  it('overrides a settings sub-section key', () => {
    const existing = { betterEditor: { settings: { sidebar: { tabLabel: 'Panel' } } } }
    const result = mergeTranslations(en, existing)
    expect(result.settings.sidebar.tabLabel).toBe('Panel')
    expect(result.settings.sidebar.position).toBe(en.settings.sidebar.position)
    expect(result.settings.viewport.tabLabel).toBe(en.settings.viewport.tabLabel)
  })

  it('ignores keys in betterEditor that are not in the built-in type', () => {
    const existing = { betterEditor: { unknown: 'ignored' } }
    const result = mergeTranslations(en, existing)
    expect((result as Record<string, unknown>).unknown).toBe('ignored')
    expect(result.toggle).toEqual(en.toggle)
  })
})
