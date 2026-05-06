'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import {
  RenderFields,
  useAllFormFields,
  useDrawerSlug,
  useField,
  useModal,
} from '@payloadcms/ui'
import { useDocConfig } from '../hooks/useDocConfig'
import { AddBlockDrawer } from './blocks/AddBlockDrawer'
import { BlockActionsToolbar } from './blocks/BlockActionsToolbar'
import { useBlockActions } from './blocks/useBlockActions'
import { findNamedField, resolveBlockSchema } from './blocks/schema'
import type { ClientBlock } from 'payload'
import { BlockEmptyState } from './blocks/BlockEmptyState'
import { BlockHeader } from './blocks/BlockHeader'

export type BlockSettingsTabProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
  onSelectPath: (path: string | null) => void
  blocksField: string
  /** Bump to open the add-after drawer externally (iframe `+` button). */
  addBelowRequestId?: number
}

export const BlockSettingsTab: React.FC<BlockSettingsTabProps> = ({
  selectedBlockPath,
  onClearSelection,
  onSelectPath,
  blocksField,
  addBelowRequestId = 0,
}) => {
  const { fields: docFields, slug: docSlug } = useDocConfig()
  const [fields] = useAllFormFields()
  const { toggleModal } = useModal()
  const addBlockDrawerSlug = useDrawerSlug('better-editor-add-block')
  const addAfterDrawerSlug = useDrawerSlug('better-editor-add-after')

  const actions = useBlockActions({
    selectedBlockPath,
    onSelectPath,
    onClearSelection,
  })

  // RAF defers to next paint so the drawer is mounted (the sidebar tab
  // may have just auto-switched to "Blocks").
  const lastHandledRequestRef = useRef(0)
  useEffect(() => {
    if (!addBelowRequestId || addBelowRequestId === lastHandledRequestRef.current) return
    if (!selectedBlockPath) return
    lastHandledRequestRef.current = addBelowRequestId
    const raf = requestAnimationFrame(() => toggleModal(addAfterDrawerSlug))
    return () => cancelAnimationFrame(raf)
  }, [addBelowRequestId, selectedBlockPath, toggleModal, addAfterDrawerSlug])

  const blocksFieldInfo = useMemo(() => {
    if (!docFields) return null
    return findNamedField(docFields, blocksField, docSlug || '')
  }, [docFields, blocksField, docSlug])

  const blocksFieldField = blocksFieldInfo?.field
  const availableBlocks: ClientBlock[] =
    blocksFieldField && blocksFieldField.type === 'blocks' ? blocksFieldField.blocks : []
  const blocksSchemaPath = blocksFieldInfo?.schemaPath || ''
  const topLevelRows = fields[blocksField]?.rows
  const addRowIndex = Array.isArray(topLevelRows) ? topLevelRows.length : 0

  if (!selectedBlockPath) {
    return (
      <>
        <BlockEmptyState
          canAdd={availableBlocks.length > 0}
          onAddClick={() => toggleModal(addBlockDrawerSlug)}
        />
        {availableBlocks.length > 0 ? (
          <AddBlockDrawer
            slug={addBlockDrawerSlug}
            blocks={availableBlocks}
            addRow={(index, blockType) =>
              actions.addAfter(blockType, blocksSchemaPath, blocksField, index)
            }
            addRowIndex={addRowIndex}
          />
        ) : null}
      </>
    )
  }

  const resolved = docFields
    ? resolveBlockSchema(docFields, docSlug || '', selectedBlockPath, fields)
    : null

  return (
    <div className="better-editor-tab better-editor-tab--native">
      <BlockHeader
        blockType={resolved?.blockType || 'unknown'}
        path={selectedBlockPath}
        onClearSelection={onClearSelection}
      />

      <hr className="better-editor-tab__divider" aria-hidden="true" />

      <BlockActionsToolbar
        canMoveUp={actions.canMoveUp}
        canMoveDown={actions.canMoveDown}
        canMutate={actions.canMutate}
        canAddBelow={!!resolved}
        onMoveUp={actions.moveUp}
        onMoveDown={actions.moveDown}
        onDuplicate={actions.duplicate}
        onAddBelow={() => toggleModal(addAfterDrawerSlug)}
        onDelete={actions.remove}
      />

      {actions.canMutate && resolved && resolved.blocksFieldBlocks.length > 0 ? (
        <AddBlockDrawer
          slug={addAfterDrawerSlug}
          blocks={resolved.blocksFieldBlocks}
          addRow={(index, blockType) =>
            actions.addAfter(
              blockType,
              resolved.blocksFieldSchemaPath,
              actions.parentPath,
              index,
            )
          }
          addRowIndex={actions.rowIndex + 1}
        />
      ) : null}

      {!resolved ? (
        <div className="better-editor-tab__empty">
          Could not resolve block schema for this path.
        </div>
      ) : (
        <>
          <BlockNameInput path={`${selectedBlockPath}.blockName`} />
          <hr className="better-editor-tab__divider" aria-hidden="true" />
          <RenderFields
            fields={resolved.blockFields}
            parentPath={resolved.parentPath}
            parentIndexPath=""
            parentSchemaPath={resolved.schemaPath}
            // RenderFields' client read-gate is bypassed; the server-side
            // write check still runs on save.
            permissions={true}
          />
        </>
      )}
    </div>
  )
}

const BlockNameInput: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const inputId = `be-blockname-${path}`
  return (
    <div className="better-editor-tab__block-name">
      <label className="better-editor-tab__block-name-label" htmlFor={inputId}>
        Block Name
      </label>
      <input
        id={inputId}
        className="better-editor-tab__block-name-input"
        type="text"
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Optional label for this block"
      />
    </div>
  )
}
