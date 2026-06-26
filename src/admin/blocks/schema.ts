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
  /** Client config block registry, used to resolve `blockReferences` slugs. */
  blocksMap?: Record<string, ClientBlock>
}

type BlocksLikeField = {
  blocks?: ClientBlock[]
  blockReferences?: (ClientBlock | string)[]
}

// Resolves a blocks field's block configs, handling `blockReferences` (slugs
// looked up in the config block registry) where the field's own `blocks` is empty.
export const resolveFieldBlocks = (
  field: BlocksLikeField,
  blocksMap: Record<string, ClientBlock> | undefined,
): ClientBlock[] => {
  if (!field.blockReferences) return field.blocks ?? []
  const out: ClientBlock[] = []
  for (const ref of field.blockReferences) {
    const block = typeof ref === 'string' ? blocksMap?.[ref] : ref
    if (block) out.push(block)
  }
  return out
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
        if (tabHasName(tab)) {
          // Named tabs own a path segment like groups do — surface as group
          // so the resolver handles them without an extra field type.
          if (tab.name === name) {
            return {
              field: { type: 'group', name: tab.name, fields: tab.fields } as ClientField,
              schemaPath: `${schemaPath}.${tab.name}`,
            }
          }
          continue
        }

        // Unnamed (presentational) tabs are "transparent".
        const found = findNamedField(tab.fields, name, schemaPath)
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
  const { docFields, docSlug, formFields, blocksMap } = context
  const segments = blockPath.split('.')
  let currentFields: ClientField[] = docFields
  let currentSchemaPath = docSlug
  let currentPath = ''
  let blockType: string | null = null
  let blockConfig: ClientBlock | null = null
  let blocksFieldSchemaPath = ''
  let blocksFieldBlocks: ClientBlock[] = []

  // Walk the path segment by segment. `blocks`/`array` consume a following
  // array index; named tabs/groups consume only their own segment (data
  // nesting without an index), so a fixed field/index pairing cannot be
  // assumed.
  let i = 0
  while (i < segments.length) {
    const fieldName = segments[i]
    const found = findNamedField(currentFields, fieldName, currentSchemaPath)
    if (!found) return null
    const field = found.field
    currentSchemaPath = found.schemaPath
    currentPath = currentPath ? `${currentPath}.${fieldName}` : fieldName
    i += 1

    if (field.type === 'blocks') {
      const indexStr = segments[i]
      if (indexStr === undefined) return null
      const index = Number(indexStr)
      if (!Number.isInteger(index) || index < 0) return null
      i += 1
      const rows = formFields[currentPath]?.rows
      if (!Array.isArray(rows) || index >= rows.length) return null
      const row = rows[index] as { blockType?: string } | undefined
      if (!row?.blockType) return null
      blockType = row.blockType
      const blocks = resolveFieldBlocks(field, blocksMap)
      blockConfig = blocks.find((b) => b.slug === blockType) ?? null
      if (!blockConfig) return null
      // Capture parent before descending — used by "add sibling block".
      blocksFieldSchemaPath = currentSchemaPath
      blocksFieldBlocks = blocks
      currentFields = blockConfig.fields
      currentSchemaPath = `${currentSchemaPath}.${blockType}`
      currentPath = `${currentPath}.${index}`
    } else if (field.type === 'array') {
      const indexStr = segments[i]
      if (indexStr === undefined) return null
      const index = Number(indexStr)
      if (!Number.isInteger(index) || index < 0) return null
      i += 1
      currentFields = field.fields
      currentPath = `${currentPath}.${index}`
    } else if (field.type === 'group') {
      // Named groups (and named tabs surfaced as groups) nest data under
      // their own segment with no array index — just descend.
      currentFields = field.fields
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
