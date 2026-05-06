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
  const runRowAction = (
    kind: 'move-up' | 'move-down' | 'duplicate' | 'remove',
  ): void => {
    if (kind === 'move-up' && !canMoveUp) return
    if (kind === 'move-down' && !canMoveDown) return
    if ((kind === 'duplicate' || kind === 'remove') && !canMutate) return
    const liveCount = rowCountAt(fields, parentPath)
    if (rowIndex >= liveCount) return
    if (kind === 'move-down' && rowIndex >= liveCount - 1) return
    commit(() => {
      switch (kind) {
        case 'move-up':
          dispatchFields({
            type: 'MOVE_ROW',
            path: parentPath,
            moveFromIndex: rowIndex,
            moveToIndex: rowIndex - 1,
          })
          break
        case 'move-down':
          dispatchFields({
            type: 'MOVE_ROW',
            path: parentPath,
            moveFromIndex: rowIndex,
            moveToIndex: rowIndex + 1,
          })
          break
        case 'duplicate':
          dispatchFields({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex })
          break
        case 'remove':
          dispatchFields({ type: 'REMOVE_ROW', path: parentPath, rowIndex })
          break
      }
    })
    if (kind === 'remove') {
      onClearSelection()
      return
    }
    const nextIndex =
      kind === 'move-up' ? rowIndex - 1 : kind === 'move-down' ? rowIndex + 1 : rowIndex + 1
    onSelectPath(`${parentPath}.${nextIndex}`)
  }

  const moveUp = () => runRowAction('move-up')
  const moveDown = () => runRowAction('move-down')
  const duplicate = () => runRowAction('duplicate')
  const remove = () => runRowAction('remove')

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
