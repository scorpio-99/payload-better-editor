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
import type { AnyClientBlock } from '../internal/types'
import { PlusIcon } from '../icons'

// `permissions={true}` skips RenderFields' client-side read gate; the
// server-side write check still runs on save.
const FULL_ACCESS = true as const

export type BlockSettingsTabProps = {
  selectedBlockPath: string | null
  onClearSelection: () => void
  onSelectPath: (path: string | null) => void
  blocksField: string
  /**
   * Bump this id to open the add-below drawer externally — used by the
   * iframe hover toolbar's `+` button.
   */
  addBelowRequestId?: number
}

/**
 * Renders the selected block's fields via Payload's native RenderFields,
 * plus an action toolbar and a Block Name input. Works at any nesting
 * depth (blocks inside tabs / collapsible / row / group / array).
 */
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

  // Open the add-after drawer when the external request id bumps.
  // RAF defers to the next paint so the drawer is mounted (the sidebar
  // tab may have just auto-switched to "Blocks").
  const lastHandledRequestRef = useRef(0)
  useEffect(() => {
    if (!addBelowRequestId || addBelowRequestId === lastHandledRequestRef.current) return
    if (!selectedBlockPath) return
    lastHandledRequestRef.current = addBelowRequestId
    requestAnimationFrame(() => {
      toggleModal(addAfterDrawerSlug)
    })
  }, [addBelowRequestId, selectedBlockPath, toggleModal, addAfterDrawerSlug])

  const blocksFieldInfo = useMemo(() => {
    if (!docFields) return null
    return findNamedField(docFields, blocksField, docSlug || '')
  }, [docFields, blocksField, docSlug])

  const blocksFieldField = blocksFieldInfo?.field
  const availableBlocks: AnyClientBlock[] =
    blocksFieldField && blocksFieldField.type === 'blocks'
      ? ((blocksFieldField.blocks || []) as AnyClientBlock[])
      : []
  const blocksSchemaPath = blocksFieldInfo?.schemaPath || ''
  const topLevelRows = fields[blocksField]?.rows
  const addRowIndex = Array.isArray(topLevelRows) ? topLevelRows.length : 0

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
            <AddBlockDrawer
              slug={addBlockDrawerSlug}
              blocks={availableBlocks}
              addRow={(index, blockType) =>
                actions.addAfter(blockType, blocksSchemaPath, blocksField, index)
              }
              addRowIndex={addRowIndex}
            />
          </>
        ) : null}
      </div>
    )
  }

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
            permissions={FULL_ACCESS}
          />
        </>
      )}
    </div>
  )
}

/** Isolated so `useField` only mounts when `path` is stable. */
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
