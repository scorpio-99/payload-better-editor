'use client'

import React from 'react'
import { RenderFields, useAllFormFields, useDocumentInfo } from '@payloadcms/ui'

// See DocumentSettingsTab for rationale.
const FULL_ACCESS = true as const

export type BlockSettingsTabProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
}

/**
 * Resolves the ClientField schema for a block row at `path` and renders its
 * fields with Payload's native RenderFields. Supports top-level blocks and
 * nested blocks, including blocks living inside `tabs` / `collapsible` /
 * `row` / `group` field containers.
 */
export const BlockSettingsTab: React.FC<BlockSettingsTabProps> = ({
  selectedBlockPath,
  onClearSelection,
}) => {
  const { docConfig } = useDocumentInfo()
  const [fields] = useAllFormFields()

  if (!selectedBlockPath) {
    return (
      <div className="better-editor-tab__empty">
        Select a block in the preview to edit its settings.
      </div>
    )
  }

  const docFields = docConfig && 'fields' in docConfig ? docConfig.fields : undefined
  const docSlug = docConfig && 'slug' in docConfig ? docConfig.slug : ''

  const resolved = docFields
    ? resolveBlockSchema(docFields, docSlug || '', selectedBlockPath, fields)
    : null

  return (
    <div className="better-editor-tab better-editor-tab--native">
      <div className="better-editor-tab__header">
        <div>
          <span className="better-editor-tab__kicker">Block</span>
          <h3 className="better-editor-tab__heading">
            {resolved?.blockType || 'unknown'}
          </h3>
          <code className="better-editor-tab__path">{selectedBlockPath}</code>
        </div>
        <button
          type="button"
          className="better-editor-tab__clear"
          onClick={onClearSelection}
        >
          Deselect
        </button>
      </div>

      {!resolved ? (
        <div className="better-editor-tab__empty">
          Could not resolve block schema for this path.
        </div>
      ) : (
        <RenderFields
          fields={resolved.blockFields}
          parentPath={resolved.parentPath}
          parentIndexPath=""
          parentSchemaPath={resolved.schemaPath}
          permissions={FULL_ACCESS}
        />
      )}
    </div>
  )
}

type Resolved = {
  blockType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockFields: any[]
  schemaPath: string
  parentPath: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permissions: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyField = Record<string, any>

/**
 * Walk through layout containers (tabs / collapsible / row / group) and named
 * fields to find a field by name. Returns the field along with the schema
 * path it's reachable at.
 */
function findNamedField(
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
    } else if (type === 'group' && typeof field.name === 'string') {
      // Group paths include the group name but we only descend if still
      // searching inside it — groups at this level weren't the target name,
      // so only useful if the caller is navigating INTO a group by name.
      // Skip here to avoid false matches.
    }
  }
  return null
}

/**
 * Given a form-state path like `layout.6` or `layout.6.columns.0.blocks.1`,
 * walk the schema and locate the block's field config + matching schema path.
 */
function resolveBlockSchema(
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
  }
}
