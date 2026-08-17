'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAllFormFields, useForm } from '@payloadcms/ui'
import { listenForParentInbound } from '../internal/postmessage.js'
import { splitFieldPath } from '../internal/path.js'
import type { FormState } from 'payload'
import { useEditorHistory } from '../state/useEditorHistory.js'
import { useLatestRef } from './useLatestRef.js'

const ID_SUFFIX = '.id'

const buildIdIndex = (fields: FormState): Map<string, string> => {
  const map = new Map<string, string>()
  for (const key of Object.keys(fields)) {
    if (!key.endsWith(ID_SUFFIX)) continue
    const value = fields[key]?.value
    if (typeof value === 'string' && value.length > 0) {
      map.set(value, key.slice(0, -ID_SUFFIX.length))
    }
  }
  return map
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

  const [allFields] = useAllFormFields()
  const idIndex = useMemo(() => buildIdIndex(allFields as FormState), [allFields])
  const { dispatchFields } = useForm()
  const history = useEditorHistory()

  // Refs let the postMessage listener stay bound across renders without
  // missing the latest form state, dispatcher, or history commit.
  const allFieldsRef = useLatestRef(allFields)
  const idIndexRef = useLatestRef(idIndex)
  const dispatchFieldsRef = useLatestRef(dispatchFields)
  const historyRef = useLatestRef(history)
  const setSelectedBlockPathRef = useLatestRef(setSelectedBlockPath)

  // Bind the postMessage listener exactly once. All four state inputs flow
  // through stable refs (above), so a re-bind is never needed.
  useEffect(
    () =>
      listenForParentInbound((data) => {
        const fields = allFieldsRef.current as FormState
        const path = idIndexRef.current.get(data.id) ?? null
        if (!path) return

        const select = setSelectedBlockPathRef.current
        const dispatch = dispatchFieldsRef.current
        const { commit } = historyRef.current

        if (data.type === 'focus-block') {
          select(path)
          return
        }

        if (data.action === 'add') {
          // Monotonic counter — BlockSettingsTab compares the latest id against
          // its lastHandledRequestRef. Date.now() risked collisions on
          // double-clicks landing in the same millisecond.
          select(path)
          setAddBelowRequestId((id) => id + 1)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
    [],
  )

  return { addBelowRequestId }
}
