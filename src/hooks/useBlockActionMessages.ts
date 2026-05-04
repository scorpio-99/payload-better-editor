'use client'

import { useEffect, useRef, useState } from 'react'
import { useAllFormFields, useForm } from '@payloadcms/ui'
import { listenForParentInbound } from '../internal/postmessage'
import { splitFieldPath } from '../internal/path'
import type { FormFieldsState } from '../internal/types'
import { useEditorHistory } from '../useEditorHistory'

const ID_SUFFIX = '.id'

const findPathById = (fields: FormFieldsState, targetId: string): string | null => {
  for (const key of Object.keys(fields)) {
    if (!key.endsWith(ID_SUFFIX)) continue
    if (fields[key]?.value === targetId) return key.slice(0, -ID_SUFFIX.length)
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
 * Receives `focus-block` and `block-action` postMessages from the iframe
 * and applies selection / row mutations (via `commit()` so undo/redo
 * stays consistent with sidebar-driven actions).
 */
export const useBlockActionMessages = ({
  setSelectedBlockPath,
}: UseBlockActionMessagesArgs): UseBlockActionMessagesReturn => {
  const [addBelowRequestId, setAddBelowRequestId] = useState<number>(0)

  // Form state in a ref so the message listener doesn't re-bind on every change.
  const [allFields] = useAllFormFields()
  const allFieldsRef = useRef(allFields)
  useEffect(() => {
    allFieldsRef.current = allFields
  }, [allFields])

  const { dispatchFields } = useForm()
  const history = useEditorHistory()

  useEffect(
    () =>
      listenForParentInbound((data) => {
        const fields = allFieldsRef.current as FormFieldsState
        const path = findPathById(fields, data.id)
        if (!path) return

        if (data.type === 'focus-block') {
          setSelectedBlockPath(path)
          return
        }

        if (data.action === 'add') {
          // The actual ADD_ROW happens once the BlocksDrawer mounts (it
          // reacts to addBelowRequestId).
          setSelectedBlockPath(path)
          setAddBelowRequestId(Date.now())
          return
        }

        const split = splitFieldPath(path)
        if (!split) return
        const { parent: parentPath, index: rowIndex } = split
        const rows = fields[parentPath]?.rows
        const rowCount = Array.isArray(rows) ? rows.length : 0
        if (rowIndex < 0 || rowIndex >= rowCount) return

        switch (data.action) {
          case 'move-up':
            if (rowIndex === 0) return
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
        }
      }),
    [dispatchFields, history, setSelectedBlockPath],
  )

  return { addBelowRequestId }
}
