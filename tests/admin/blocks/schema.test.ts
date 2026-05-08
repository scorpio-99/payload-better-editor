import { describe, expect, it } from 'vitest'
import type { ClientBlock, ClientField, FormState } from 'payload'
import { findNamedField, resolveBlockSchema } from '../../../src/admin/blocks/schema'

// Minimal field/block fixtures cast to Payload's client types — we only
// exercise the structural traversal here, not the full Payload runtime.
const text = (name: string): ClientField =>
  ({ name, type: 'text' }) as unknown as ClientField

const block = (slug: string, fields: ClientField[]): ClientBlock =>
  ({ slug, fields }) as unknown as ClientBlock

const blocksField = (name: string, blocks: ClientBlock[]): ClientField =>
  ({ name, type: 'blocks', blocks }) as unknown as ClientField

const collapsible = (fields: ClientField[]): ClientField =>
  ({ type: 'collapsible', fields }) as unknown as ClientField

const tabs = (entries: { name?: string; fields: ClientField[] }[]): ClientField =>
  ({ type: 'tabs', tabs: entries }) as unknown as ClientField

describe('findNamedField', () => {
  it('finds a top-level named field', () => {
    const fields = [text('title'), text('slug')]
    const found = findNamedField(fields, 'slug', 'pages')
    expect(found).toEqual({ field: fields[1], schemaPath: 'pages.slug' })
  })

  it('returns null when the field is not present', () => {
    expect(findNamedField([text('title')], 'missing', 'pages')).toBeNull()
  })

  it('descends into row/collapsible without changing the schema path', () => {
    const inner = text('hidden')
    const fields = [collapsible([inner])]
    const found = findNamedField(fields, 'hidden', 'pages')
    expect(found).toEqual({ field: inner, schemaPath: 'pages.hidden' })
  })

  it('appends the named-tab segment to the schema path', () => {
    const inner = text('seoTitle')
    const fields = [tabs([{ name: 'seo', fields: [inner] }])]
    const found = findNamedField(fields, 'seoTitle', 'pages')
    expect(found).toEqual({ field: inner, schemaPath: 'pages.seo.seoTitle' })
  })

  it('does not descend into a group (groups own their path segment)', () => {
    const groupChild = text('inside')
    const groupField = {
      name: 'group',
      type: 'group',
      fields: [groupChild],
    } as unknown as ClientField
    expect(findNamedField([groupField], 'inside', 'pages')).toBeNull()
  })
})

describe('resolveBlockSchema', () => {
  const heroFields = [text('headline'), text('cta')]
  const heroBlock = block('hero', heroFields)
  const docFields = [blocksField('layout', [heroBlock])]

  const formState = (): FormState =>
    ({
      layout: { rows: [{ blockType: 'hero' }] },
    }) as unknown as FormState

  it('resolves a single-level block path', () => {
    const out = resolveBlockSchema(
      { docFields, docSlug: 'pages', formFields: formState() },
      'layout.0',
    )
    expect(out).not.toBeNull()
    expect(out!.blockType).toBe('hero')
    expect(out!.blockFields).toBe(heroFields)
    expect(out!.schemaPath).toBe('pages.layout.hero')
    expect(out!.parentPath).toBe('layout.0')
    expect(out!.blocksFieldSchemaPath).toBe('pages.layout')
    expect(out!.blocksFieldBlocks).toHaveLength(1)
  })

  it('returns null when the row does not exist in form state', () => {
    const out = resolveBlockSchema(
      { docFields, docSlug: 'pages', formFields: formState() },
      'layout.9',
    )
    expect(out).toBeNull()
  })

  it('returns null when the path does not target a blocks field', () => {
    const flat: ClientField[] = [text('title')]
    const out = resolveBlockSchema(
      { docFields: flat, docSlug: 'pages', formFields: formState() },
      'title.0',
    )
    expect(out).toBeNull()
  })

  it('returns null when the index is malformed', () => {
    const out = resolveBlockSchema(
      { docFields, docSlug: 'pages', formFields: formState() },
      'layout.-1',
    )
    expect(out).toBeNull()
  })
})
