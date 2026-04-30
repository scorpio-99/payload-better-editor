'use client'

import { useEffect, useRef, useState } from 'react'
import { useAllFormFields, useForm } from '@payloadcms/ui'
import { isParentInboundMessage } from '../preview/protocol'
import { useEditorHistory } from '../useEditorHistory'

/**
 * Walk the flat form-state map and find the block whose `id` field equals
 * `targetId`. Returns the path prefix (e.g. `layout.2.columns.0.blocks.1`)
 * or null if no row owns this id. Works for arbitrarily nested blocks
 * because Payload stores every block row's auto-generated id at
 * `<path>.id` regardless of depth.
 */
function findPathById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>,
  targetId: string,
): string | null {
  for (const key in fields) {
    if (!key.endsWith('.id')) continue
    if (fields[key]?.value === targetId) {
      return key.slice(0, -'.id'.length)
    }
  }
  return null
}

export type UseBlockActionMessagesArgs = {
  selectedBlockPath: string | null
  setSelectedBlockPath: (path: string | null) => void
}

export type UseBlockActionMessagesReturn = {
  addBelowRequestId: number
}

/**
 * Listens for postMessage events from the preview iframe (focus-block +
 * block-action) and applies the appropriate selection / form-state
 * mutations. Mutations are wrapped in `useEditorHistory().commit()` so
 * undo/redo stays consistent with sidebar-driven mutations.
 *
 * Returns an `addBelowRequestId` that bumps each time the iframe asks to
 * add a sibling block; BlockSettingsTab observes this to open the
 * BlocksDrawer scoped to the parent's allowed blocks.
 */
export const useBlockActionMessages = ({
  setSelectedBlockPath,
}: UseBlockActionMessagesArgs): UseBlockActionMessagesReturn => {
  const [addBelowRequestId, setAddBelowRequestId] = useState<number>(0)

  // Subscribe to the document's form state so we can resolve a clicked
  // block's id back to its form-state path. Kept in a ref so the
  // postMessage listener doesn't have to re-bind on every form change.
  const [allFields] = useAllFormFields()
  const allFieldsRef = useRef(allFields)
  useEffect(() => {
    allFieldsRef.current = allFields
  }, [allFields])

  const { dispatchFields } = useForm()
  const history = useEditorHistory()

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!isParentInboundMessage(data)) return

      if (data.type === 'focus-block') {
        const path = findPathById(allFieldsRef.current, data.id)
        if (path) setSelectedBlockPath(path)
        return
      }

      // block-action
      const path = findPathById(allFieldsRef.current, data.id)
      if (!path) return
      const lastDot = path.lastIndexOf('.')
      if (lastDot < 0) return
      const parentPath = path.slice(0, lastDot)
      const rowIndex = Number(path.slice(lastDot + 1))
      if (Number.isNaN(rowIndex)) return
      const rows = allFieldsRef.current[parentPath]?.rows
      const rowCount = Array.isArray(rows) ? rows.length : 0

      // "add" is handled separately — no mutation here. We just select
      // the clicked block and ping BlockSettingsTab to open its
      // BlocksDrawer; the actual ADD_ROW dispatch (and snapshot) lives
      // in addRowAfterSelected when the drawer's user picks a block.
      if (data.action === 'add') {
        setSelectedBlockPath(path)
        setAddBelowRequestId(Date.now())
        return
      }

      switch (data.action) {
        case 'move-up':
          if (rowIndex <= 0) return
          history.commit(() =>
            dispatchFields({
              type: 'MOVE_ROW',
              path: parentPath,
              moveFromIndex: rowIndex,
              moveToIndex: rowIndex - 1,
            }),
          )
          setSelectedBlockPath(`${parentPath}.${rowIndex - 1}`)
          break
        case 'move-down':
          if (rowIndex >= rowCount - 1) return
          history.commit(() =>
            dispatchFields({
              type: 'MOVE_ROW',
              path: parentPath,
              moveFromIndex: rowIndex,
              moveToIndex: rowIndex + 1,
            }),
          )
          setSelectedBlockPath(`${parentPath}.${rowIndex + 1}`)
          break
        case 'duplicate':
          history.commit(() =>
            dispatchFields({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex }),
          )
          setSelectedBlockPath(`${parentPath}.${rowIndex + 1}`)
          break
        case 'delete':
          history.commit(() =>
            dispatchFields({ type: 'REMOVE_ROW', path: parentPath, rowIndex }),
          )
          setSelectedBlockPath(null)
          break
        default:
          return
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatchFields, history, setSelectedBlockPath])

  return { addBelowRequestId }
}
