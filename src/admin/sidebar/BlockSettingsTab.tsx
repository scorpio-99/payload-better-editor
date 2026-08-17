'use client'

import React, { useMemo } from 'react'
import {
  RenderFields,
  useAllFormFields,
  useConfig,
  useDrawerSlug,
  useField,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { useDocConfig } from '../../hooks/useDocConfig.js'
import { useAddBlockDrawer } from '../../hooks/useAddBlockDrawer.js'
import { AddBlockDrawer } from '../blocks/AddBlockDrawer.js'
import { BlockActionsToolbar } from '../blocks/BlockActionsToolbar.js'
import { useBlockActions } from '../blocks/useBlockActions.js'
import { findNamedField, resolveBlockSchema, resolveFieldBlocks } from '../blocks/schema.js'
import type { ClientBlock } from 'payload'
import { BlockEmptyState } from '../blocks/BlockEmptyState.js'
import { BlockHeader } from '../blocks/BlockHeader.js'
import { useBetterEditorT } from '../../i18n/useBetterEditorT.js'

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
  const t = useBetterEditorT()
  const { i18n } = useTranslation()
  const { fields: docFields, slug: docSlug } = useDocConfig()
  const [fields] = useAllFormFields()
  const { config } = useConfig()
  const blocksMap = config.blocksMap
  const { toggleModal } = useModal()
  const addBlockDrawerSlug = useDrawerSlug('better-editor-add-block')
  const addAfterDrawerSlug = useDrawerSlug('better-editor-add-after')

  const actions = useBlockActions({
    selectedBlockPath,
    onSelectPath,
    onClearSelection,
  })

  useAddBlockDrawer({
    drawerSlug: addAfterDrawerSlug,
    requestId: addBelowRequestId,
    selectedBlockPath,
  })

  const blocksFieldInfo = useMemo(() => {
    if (!docFields) return null
    return findNamedField(docFields, blocksField, docSlug || '')
  }, [docFields, blocksField, docSlug])

  const blocksFieldField = blocksFieldInfo?.field
  const availableBlocks: ClientBlock[] =
    blocksFieldField && blocksFieldField.type === 'blocks'
      ? resolveFieldBlocks(blocksFieldField, blocksMap)
      : []
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
              actions.addAfter({
                blockType,
                schemaPath: blocksSchemaPath,
                containerPath: blocksField,
                index,
              })
            }
            addRowIndex={addRowIndex}
          />
        ) : null}
      </>
    )
  }

  const resolved = docFields
    ? resolveBlockSchema(
        { docFields, docSlug: docSlug || '', formFields: fields, blocksMap },
        selectedBlockPath,
      )
    : null

  const blockLabel = (() => {
    if (!resolved) return undefined
    const cfg = resolved.blocksFieldBlocks.find((b) => b.slug === resolved.blockType)
    const singular = cfg?.labels?.singular
    if (typeof singular === 'string') return singular
    if (singular && typeof singular === 'object') {
      return (singular as Record<string, string>)[i18n.language] ?? Object.values(singular)[0] as string | undefined
    }
    return undefined
  })()

  return (
    <div className="better-editor-tab better-editor-tab--native">
      <BlockHeader
        blockType={resolved?.blockType || 'unknown'}
        blockLabel={blockLabel}
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
            actions.addAfter({
              blockType,
              schemaPath: resolved.blocksFieldSchemaPath,
              containerPath: actions.parentPath,
              index,
            })
          }
          addRowIndex={actions.rowIndex + 1}
        />
      ) : null}

      {!resolved ? (
        <div className="better-editor-tab__empty">{t.blocks.schemaError}</div>
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
  const t = useBetterEditorT()
  const inputId = `be-blockname-${path}`
  return (
    <div className="better-editor-tab__block-name">
      <label className="better-editor-tab__block-name-label" htmlFor={inputId}>
        {t.blocks.blockName}
      </label>
      <input
        id={inputId}
        className="better-editor-tab__block-name-input"
        type="text"
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.blocks.blockNamePlaceholder}
      />
    </div>
  )
}
