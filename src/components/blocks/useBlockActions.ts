'use client'

import { useAllFormFields, useForm } from '@payloadcms/ui'
import { useEditorHistory } from '../../useEditorHistory'
import { splitFieldPath } from '../../internal/path'

type Args = {
  selectedBlockPath: string | null
  onSelectPath: (path: string | null) => void
  onClearSelection: () => void
}

const rowCountAt = (
  fields: ReturnType<typeof useAllFormFields>[0],
  path: string,
): number => {
  const rows = fields[path]?.rows
  return Array.isArray(rows) ? rows.length : 0
}

export const useBlockActions = ({
  selectedBlockPath,
  onSelectPath,
  onClearSelection,
}: Args) => {
  const [fields] = useAllFormFields()
  const { addFieldRow, dispatchFields } = useForm()
  const { commit } = useEditorHistory()

  const split = selectedBlockPath ? splitFieldPath(selectedBlockPath) : null
  const parentPath = split?.parent ?? ''
  const rowIndex = split ? split.index : NaN
  const rowCount = parentPath ? rowCountAt(fields, parentPath) : 0
  const canMutate = !Number.isNaN(rowIndex) && parentPath !== '' && rowIndex < rowCount
  const canMoveUp = canMutate && rowIndex > 0
  const canMoveDown = canMutate && rowIndex < rowCount - 1

  // Re-check bounds at call time: form state may have shifted between
  // render and click (e.g. another action just removed the row).
  const moveUp = () => {
    if (!canMoveUp) return
    if (rowIndex >= rowCountAt(fields, parentPath)) return
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
    if (rowIndex >= rowCountAt(fields, parentPath) - 1) return
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
    if (rowIndex >= rowCountAt(fields, parentPath)) return
    commit(() => {
      dispatchFields({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex })
    })
    onSelectPath(`${parentPath}.${rowIndex + 1}`)
  }

  const remove = () => {
    if (!canMutate) return
    if (rowIndex >= rowCountAt(fields, parentPath)) return
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
