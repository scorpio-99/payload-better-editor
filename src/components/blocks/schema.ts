/**
 * Pure schema-walking helpers for the block sidebar — no React, no
 * Payload UI imports. Translate between form-state paths
 * (e.g. `layout.6.columns.0.blocks.1`) and underlying field configs.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyField = Record<string, any>

export type Resolved = {
  blockType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockFields: any[]
  schemaPath: string
  parentPath: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permissions: any
  blocksFieldSchemaPath: string
  blocksFieldBlocks: AnyField[]
}

/** Walk tabs / collapsible / row containers to find a named field. */
export function findNamedField(
  fields: AnyField[],
  name: string,
  schemaPath: string,
): { field: AnyField; schemaPath: string } | null {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue

    if (typeof field.name === 'string' && field.name === name) {
      return { field, schemaPath: `${schemaPath}.${name}` }
    }

    const type = field.type

    if (type === 'tabs' && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        const tabSchemaPath =
          typeof tab?.name === 'string' ? `${schemaPath}.${tab.name}` : schemaPath
        const found = findNamedField(tab?.fields || [], name, tabSchemaPath)
        if (found) return found
      }
    } else if (type === 'collapsible' || type === 'row') {
      const found = findNamedField(field.fields || [], name, schemaPath)
      if (found) return found
    }
    // Groups intentionally don't descend here: their fields are reached
    // via the group's own name as the next path segment, not by walking
    // through them transparently.
  }
  return null
}

/**
 * Walk a form-state path like `layout.6.columns.0.blocks.1` and return
 * the resolved block config + matching schema path.
 */
export function resolveBlockSchema(
  docFields: AnyField[],
  docSlug: string,
  path: string,
  formFields: Record<string, AnyField>,
): Resolved | null {
  const segments = path.split('.')
  let currentFields: AnyField[] = docFields
  let currentSchemaPath = docSlug
  let currentPath = ''
  let blockType: string | null = null
  let blockConfig: AnyField | null = null
  let blocksFieldSchemaPath = ''
  let blocksFieldBlocks: AnyField[] = []

  for (let i = 0; i < segments.length; i += 2) {
    const fieldName = segments[i]
    const indexStr = segments[i + 1]
    if (indexStr === undefined) break
    const index = Number(indexStr)
    if (Number.isNaN(index)) return null

    const found = findNamedField(currentFields, fieldName, currentSchemaPath)
    if (!found) return null
    const field = found.field
    currentSchemaPath = found.schemaPath
    currentPath = currentPath ? `${currentPath}.${fieldName}` : fieldName

    if (field.type === 'blocks') {
      const rows = formFields[currentPath]?.rows
      const row = Array.isArray(rows) ? rows[index] : undefined
      if (!row?.blockType) return null
      blockType = row.blockType as string
      blockConfig = (field.blocks || []).find((b: AnyField) => b.slug === blockType) || null
      if (!blockConfig) return null
      // Capture parent before descending — used by "add sibling block".
      blocksFieldSchemaPath = currentSchemaPath
      blocksFieldBlocks = (field.blocks || []) as AnyField[]
      currentFields = blockConfig.fields || []
      currentSchemaPath = `${currentSchemaPath}.${blockType}`
      currentPath = `${currentPath}.${index}`
    } else if (field.type === 'array') {
      currentFields = field.fields || []
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
    permissions: {},
    blocksFieldSchemaPath,
    blocksFieldBlocks,
  }
}
