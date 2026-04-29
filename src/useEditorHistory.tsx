'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAllFormFields, useForm } from '@payloadcms/ui'

type Snapshot = ReturnType<typeof useAllFormFields>[0]

type HistoryContextValue = {
  pushSnapshot: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const DEFAULT_VALUE: HistoryContextValue = {
  pushSnapshot: () => {},
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
}

const Ctx = createContext<HistoryContextValue>(DEFAULT_VALUE)

export const useEditorHistory = () => useContext(Ctx)

const MAX_HISTORY = 50

/**
 * Snapshot-based undo/redo for block actions inside the overlay. Callers
 * invoke `pushSnapshot()` BEFORE a `dispatchFields` mutation; undo/redo
 * restore the entire form state via REPLACE_STATE. New edits after an
 * undo clear the redo stack (standard linear history).
 *
 * History is in-memory and resets when the overlay unmounts. Capped at
 * MAX_HISTORY entries; oldest are dropped.
 */
export const EditorHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fields] = useAllFormFields()
  const fieldsRef = useRef(fields)
  useEffect(() => {
    fieldsRef.current = fields
  }, [fields])

  const { dispatchFields, setModified } = useForm()
  const [undoStack, setUndoStack] = useState<Snapshot[]>([])
  const [redoStack, setRedoStack] = useState<Snapshot[]>([])
  // Refs mirror the stacks so undo/redo can read the latest values without
  // running side effects inside a setState updater (React 18+ may invoke
  // updaters speculatively during another component's render — calling
  // `dispatchFields` from there throws the "set state during render" warning).
  const undoStackRef = useRef(undoStack)
  const redoStackRef = useRef(redoStack)
  useEffect(() => {
    undoStackRef.current = undoStack
  }, [undoStack])
  useEffect(() => {
    redoStackRef.current = redoStack
  }, [redoStack])
  const restoringRef = useRef(false)

  const pushSnapshot = useCallback(() => {
    if (restoringRef.current) return
    const next = [...undoStackRef.current, fieldsRef.current]
    setUndoStack(next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next)
    setRedoStack([])
  }, [])

  const undo = useCallback(() => {
    const stack = undoStackRef.current
    if (stack.length === 0) return
    const target = stack[stack.length - 1]
    setUndoStack(stack.slice(0, -1))
    setRedoStack([...redoStackRef.current, fieldsRef.current])
    restoringRef.current = true
    dispatchFields({ type: 'REPLACE_STATE', state: target })
    setModified(true)
    // Release on the next tick so the resulting form re-render doesn't
    // re-enter pushSnapshot via any side effects.
    setTimeout(() => {
      restoringRef.current = false
    }, 0)
  }, [dispatchFields, setModified])

  const redo = useCallback(() => {
    const stack = redoStackRef.current
    if (stack.length === 0) return
    const target = stack[stack.length - 1]
    setRedoStack(stack.slice(0, -1))
    setUndoStack([...undoStackRef.current, fieldsRef.current])
    restoringRef.current = true
    dispatchFields({ type: 'REPLACE_STATE', state: target })
    setModified(true)
    setTimeout(() => {
      restoringRef.current = false
    }, 0)
  }, [dispatchFields, setModified])

  const value = useMemo<HistoryContextValue>(
    () => ({
      pushSnapshot,
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
    }),
    [pushSnapshot, undo, redo, undoStack.length, redoStack.length],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
