import type { ClientTab } from 'payload'
import type { ClientBlock, ClientField, FormState } from 'payload'

export type Resolved = {
  blockType: string
  blockFields: ClientField[]
  schemaPath: string
  parentPath: string
  blocksFieldSchemaPath: string
  blocksFieldBlocks: ClientBlock[]
}

export type BlockSchemaContext = {
  docFields: ClientField[]
  docSlug: string
  formFields: FormState
}

const tabHasName = (tab: ClientTab): tab is ClientTab & { name: string } =>
  typeof (tab as { name?: unknown }).name === 'string'

export const findNamedField = (
  fields: ClientField[],
  name: string,
  schemaPath: string,
): { field: ClientField; schemaPath: string } | null => {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue

    if ('name' in field && typeof field.name === 'string' && field.name === name) {
      return { field, schemaPath: `${schemaPath}.${name}` }
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath
        const found = findNamedField(tab.fields, name, tabSchemaPath)
        if (found) return found
      }
    } else if (field.type === 'collapsible' || field.type === 'row') {
      const found = findNamedField(field.fields, name, schemaPath)
      if (found) return found
    }
    // Groups are not transparent: their inner fields are reached via the
    // group's own name as the next path segment.
  }
  return null
}

export const resolveBlockSchema = (
  context: BlockSchemaContext,
  blockPath: string,
): Resolved | null => {
  const { docFields, docSlug, formFields } = context
  const segments = blockPath.split('.')
  let currentFields: ClientField[] = docFields
  let currentSchemaPath = docSlug
  let currentPath = ''
  let blockType: string | null = null
  let blockConfig: ClientBlock | null = null
  let blocksFieldSchemaPath = ''
  let blocksFieldBlocks: ClientBlock[] = []

  for (let i = 0; i < segments.length; i += 2) {
    const fieldName = segments[i]
    const indexStr = segments[i + 1]
    if (indexStr === undefined) break
    const index = Number(indexStr)
    if (!Number.isInteger(index) || index < 0) return null

    const found = findNamedField(currentFields, fieldName, currentSchemaPath)
    if (!found) return null
    const field = found.field
    currentSchemaPath = found.schemaPath
    currentPath = currentPath ? `${currentPath}.${fieldName}` : fieldName

    if (field.type === 'blocks') {
      const rows = formFields[currentPath]?.rows
      if (!Array.isArray(rows) || index >= rows.length) return null
      const row = rows[index] as { blockType?: string } | undefined
      if (!row?.blockType) return null
      blockType = row.blockType
      const blocks = field.blocks
      blockConfig = blocks.find((b) => b.slug === blockType) ?? null
      if (!blockConfig) return null
      // Capture parent before descending — used by "add sibling block".
      blocksFieldSchemaPath = currentSchemaPath
      blocksFieldBlocks = blocks
      currentFields = blockConfig.fields
      currentSchemaPath = `${currentSchemaPath}.${blockType}`
      currentPath = `${currentPath}.${index}`
    } else if (field.type === 'array') {
      currentFields = field.fields
      currentPath = `${currentPath}.${index}`
    } else {
      return null
    }
  }

  if (!blockType || !blockConfig) return null

  return {
    blockType,
    blockFields: currentFields,
    schemaPath: currentSchemaPath,
    parentPath: currentPath,
    blocksFieldSchemaPath,
    blocksFieldBlocks,
  }
}
