'use client'

import React, { useCallback, useMemo } from 'react'
import {
  BlocksDrawer,
  RenderFields,
  useAllFormFields,
  useDocumentInfo,
  useDrawerSlug,
  useField,
  useForm,
  useModal,
} from '@payloadcms/ui'

// See DocumentSettingsTab for rationale.
const FULL_ACCESS = true as const

export type BlockSettingsTabProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
  onSelectPath: (path: string | null) => void
  blocksField: string
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

/**
 * Resolves the ClientField schema for a block row at `path` and renders its
 * fields with Payload's native RenderFields. Supports top-level blocks and
 * nested blocks, including blocks living inside `tabs` / `collapsible` /
 * `row` / `group` field containers.
 */
export const BlockSettingsTab: React.FC<BlockSettingsTabProps> = ({
  selectedBlockPath,
  onClearSelection,
  onSelectPath,
  blocksField,
}) => {
  const { docConfig } = useDocumentInfo()
  const [fields] = useAllFormFields()
  const { addFieldRow, dispatchFields, setModified } = useForm()
  const { toggleModal } = useModal()
  const addBlockDrawerSlug = useDrawerSlug('better-editor-add-block')

  const docFields = docConfig && 'fields' in docConfig ? docConfig.fields : undefined
  const docSlug = docConfig && 'slug' in docConfig ? docConfig.slug : ''

  // Resolve the top-level blocks field config so we can hand its
  // `blocks[]` to BlocksDrawer (the same picker used by Payload's native
  // Blocks field) and know the schemaPath for addFieldRow.
  const blocksFieldInfo = useMemo(() => {
    if (!docFields) return null
    return findNamedField(docFields, blocksField, docSlug || '')
  }, [docFields, blocksField, docSlug])

  const availableBlocks = (blocksFieldInfo?.field?.blocks as AnyField[] | undefined) || []
  const blocksSchemaPath = blocksFieldInfo?.schemaPath || ''
  const topLevelRows = fields[blocksField]?.rows
  const addRowIndex = Array.isArray(topLevelRows) ? topLevelRows.length : 0

  const addTopLevelRow = useCallback(
    (index: number, blockType?: string) => {
      addFieldRow({
        blockType,
        path: blocksField,
        rowIndex: index,
        schemaPath: blocksSchemaPath,
      })
      setModified(true)
    },
    [addFieldRow, blocksField, blocksSchemaPath, setModified],
  )

  if (!selectedBlockPath) {
    return (
      <div className="better-editor-tab better-editor-tab--empty">
        <p className="better-editor-tab__empty-text">
          Select a block in the preview to edit its settings.
        </p>
        {availableBlocks.length > 0 ? (
          <>
            <button
              type="button"
              className="better-editor-tab__add-block"
              onClick={() => toggleModal(addBlockDrawerSlug)}
            >
              <PlusIcon />
              <span>Add Block</span>
            </button>
            <BlocksDrawer
              addRow={addTopLevelRow}
              addRowIndex={addRowIndex}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              blocks={availableBlocks as any}
              drawerSlug={addBlockDrawerSlug}
              labels={{ singular: 'Block', plural: 'Blocks' }}
            />
          </>
        ) : null}
      </div>
    )
  }

  const resolved = docFields
    ? resolveBlockSchema(docFields, docSlug || '', selectedBlockPath, fields)
    : null

  // Split `selectedBlockPath` into the parent blocks-field path + index so we
  // can dispatch row mutations against the parent. Works for top-level
  // (`layout.2`) and nested (`layout.2.columns.0.blocks.1`) alike.
  const lastDot = selectedBlockPath.lastIndexOf('.')
  const parentPath = lastDot >= 0 ? selectedBlockPath.slice(0, lastDot) : ''
  const rowIndex = lastDot >= 0 ? Number(selectedBlockPath.slice(lastDot + 1)) : NaN
  const parentRows = parentPath ? fields[parentPath]?.rows : undefined
  const rowCount = Array.isArray(parentRows) ? parentRows.length : 0
  const canMoveUp = !Number.isNaN(rowIndex) && rowIndex > 0
  const canMoveDown = !Number.isNaN(rowIndex) && rowIndex < rowCount - 1
  const canMutate = !Number.isNaN(rowIndex) && parentPath !== ''

  // dispatchFields mutates the field map but doesn't flip the form's
  // `modified` flag — autosave + live-preview-refresh hang off that, so
  // they wouldn't fire after a row mutation. setModified(true) restores
  // the same behavior typing into an input gives us.
  const markModified = () => setModified(true)

  const moveUp = () => {
    if (!canMoveUp) return
    dispatchFields({
      type: 'MOVE_ROW',
      path: parentPath,
      moveFromIndex: rowIndex,
      moveToIndex: rowIndex - 1,
    })
    markModified()
    onSelectPath(`${parentPath}.${rowIndex - 1}`)
  }
  const moveDown = () => {
    if (!canMoveDown) return
    dispatchFields({
      type: 'MOVE_ROW',
      path: parentPath,
      moveFromIndex: rowIndex,
      moveToIndex: rowIndex + 1,
    })
    markModified()
    onSelectPath(`${parentPath}.${rowIndex + 1}`)
  }
  const duplicate = () => {
    if (!canMutate) return
    dispatchFields({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex })
    markModified()
    // Payload inserts the duplicate immediately after the source row.
    onSelectPath(`${parentPath}.${rowIndex + 1}`)
  }
  const remove = () => {
    if (!canMutate) return
    dispatchFields({ type: 'REMOVE_ROW', path: parentPath, rowIndex })
    markModified()
    onClearSelection()
  }

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

      {canMutate ? (
        <div className="better-editor-tab__actions" role="toolbar" aria-label="Block actions">
          <button
            type="button"
            className="better-editor-tab__action"
            onClick={moveUp}
            disabled={!canMoveUp}
            title="Move up"
            aria-label="Move block up"
          >
            <ChevronUp />
          </button>
          <button
            type="button"
            className="better-editor-tab__action"
            onClick={moveDown}
            disabled={!canMoveDown}
            title="Move down"
            aria-label="Move block down"
          >
            <ChevronDown />
          </button>
          <button
            type="button"
            className="better-editor-tab__action"
            onClick={duplicate}
            title="Duplicate"
            aria-label="Duplicate block"
          >
            <CopyIcon />
          </button>
          <button
            type="button"
            className="better-editor-tab__action better-editor-tab__action--danger"
            onClick={remove}
            title="Delete"
            aria-label="Delete block"
          >
            <TrashIcon />
          </button>
        </div>
      ) : null}

      {!resolved ? (
        <div className="better-editor-tab__empty">
          Could not resolve block schema for this path.
        </div>
      ) : (
        <>
          <BlockNameInput path={`${selectedBlockPath}.blockName`} />
          <RenderFields
            fields={resolved.blockFields}
            parentPath={resolved.parentPath}
            parentIndexPath=""
            parentSchemaPath={resolved.schemaPath}
            permissions={FULL_ACCESS}
          />
        </>
      )}
    </div>
  )
}

/**
 * Tiny isolated component so `useField` is only mounted while we have a
 * resolved block path — `useField` requires a stable path for the
 * lifetime of the component.
 */
const BlockNameInput: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  return (
    <div className="better-editor-tab__block-name">
      <label className="better-editor-tab__block-name-label" htmlFor={`be-blockname-${path}`}>
        Block Name
      </label>
      <input
        id={`be-blockname-${path}`}
        className="better-editor-tab__block-name-input"
        type="text"
        value={(value as string) || ''}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Optional label for this block"
      />
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
