'use client'

import { useAllFormFields, useForm } from '@payloadcms/ui'
import { useEditorHistory } from '../../useEditorHistory'

type Args = {
  selectedBlockPath: string | null
  onSelectPath: (path: string | null) => void
  onClearSelection: () => void
}

/**
 * Row-mutation actions for the selected block. Each goes through
 * `commit()` so undo/redo + the form's modified flag stay in sync, and
 * the selection follows the block's new index after move / duplicate.
 */
export const useBlockActions = ({
  selectedBlockPath,
  onSelectPath,
  onClearSelection,
}: Args) => {
  const [fields] = useAllFormFields()
  const { addFieldRow, dispatchFields } = useForm()
  const { commit } = useEditorHistory()

  const lastDot = selectedBlockPath ? selectedBlockPath.lastIndexOf('.') : -1
  const parentPath =
    selectedBlockPath && lastDot >= 0 ? selectedBlockPath.slice(0, lastDot) : ''
  const rowIndex =
    selectedBlockPath && lastDot >= 0
      ? Number(selectedBlockPath.slice(lastDot + 1))
      : NaN
  const parentRows = parentPath ? fields[parentPath]?.rows : undefined
  const rowCount = Array.isArray(parentRows) ? parentRows.length : 0
  const canMoveUp = !Number.isNaN(rowIndex) && rowIndex > 0
  const canMoveDown = !Number.isNaN(rowIndex) && rowIndex < rowCount - 1
  const canMutate = !Number.isNaN(rowIndex) && parentPath !== ''

  const moveUp = () => {
    if (!canMoveUp) return
    commit(() => {
      dispatchFields({
        type: 'MOVE_ROW',
        path: parentPath,
        moveFromIndex: rowIndex,
        moveToIndex: rowIndex - 1,
      })
    })
    onSelectPath(`${parentPath}.${rowIndex - 1}`)
  }

  const moveDown = () => {
    if (!canMoveDown) return
    commit(() => {
      dispatchFields({
        type: 'MOVE_ROW',
        path: parentPath,
        moveFromIndex: rowIndex,
        moveToIndex: rowIndex + 1,
      })
    })
    onSelectPath(`${parentPath}.${rowIndex + 1}`)
  }

  const duplicate = () => {
    if (!canMutate) return
    commit(() => {
      dispatchFields({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex })
    })
    // Duplicate is inserted immediately after the source row.
    onSelectPath(`${parentPath}.${rowIndex + 1}`)
  }

  const remove = () => {
    if (!canMutate) return
    commit(() => {
      dispatchFields({ type: 'REMOVE_ROW', path: parentPath, rowIndex })
    })
    onClearSelection()
  }

  const addAfter = (
    blockType: string | undefined,
    schemaPath: string,
    blocksFieldPath: string,
    insertIndex: number,
  ) => {
    commit(() => {
      addFieldRow({
        blockType,
        path: blocksFieldPath,
        rowIndex: insertIndex,
        schemaPath,
      })
    })
    onSelectPath(`${blocksFieldPath}.${insertIndex}`)
  }

  return {
    moveUp,
    moveDown,
    duplicate,
    remove,
    addAfter,
    canMoveUp,
    canMoveDown,
    canMutate,
    parentPath,
    rowIndex,
    rowCount,
  }
}
