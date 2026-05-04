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

export const useBlockActionMessages = ({
  setSelectedBlockPath,
}: UseBlockActionMessagesArgs): UseBlockActionMessagesReturn => {
  const [addBelowRequestId, setAddBelowRequestId] = useState<number>(0)

  // Form state in a ref so the listener doesn't re-bind on every keystroke.
  const [allFields] = useAllFormFields()
  const allFieldsRef = useRef(allFields)
  allFieldsRef.current = allFields

  // History context value changes whenever undo/redo depth flips; refs
  // prevent re-binding the postMessage listener on every commit.
  const { dispatchFields } = useForm()
  const dispatchFieldsRef = useRef(dispatchFields)
  dispatchFieldsRef.current = dispatchFields
  const history = useEditorHistory()
  const historyRef = useRef(history)
  historyRef.current = history

  const setSelectedBlockPathRef = useRef(setSelectedBlockPath)
  setSelectedBlockPathRef.current = setSelectedBlockPath

  useEffect(
    () =>
      listenForParentInbound((data) => {
        const fields = allFieldsRef.current as FormFieldsState
        const path = findPathById(fields, data.id)
        if (!path) return

        const select = setSelectedBlockPathRef.current
        const dispatch = dispatchFieldsRef.current
        const { commit } = historyRef.current

        if (data.type === 'focus-block') {
          select(path)
          return
        }

        if (data.action === 'add') {
          // ADD_ROW happens once the BlocksDrawer mounts and reacts to
          // addBelowRequestId.
          select(path)
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
            commit(() =>
              dispatch({
                type: 'MOVE_ROW',
                path: parentPath,
                moveFromIndex: rowIndex,
                moveToIndex: rowIndex - 1,
              }),
            )
            select(`${parentPath}.${rowIndex - 1}`)
            break
          case 'move-down':
            if (rowIndex >= rowCount - 1) return
            commit(() =>
              dispatch({
                type: 'MOVE_ROW',
                path: parentPath,
                moveFromIndex: rowIndex,
                moveToIndex: rowIndex + 1,
              }),
            )
            select(`${parentPath}.${rowIndex + 1}`)
            break
          case 'duplicate':
            commit(() => dispatch({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex }))
            select(`${parentPath}.${rowIndex + 1}`)
            break
          case 'delete':
            commit(() => dispatch({ type: 'REMOVE_ROW', path: parentPath, rowIndex }))
            select(null)
            break
        }
      }),
    [],
  )

  return { addBelowRequestId }
}
