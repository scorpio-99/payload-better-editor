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
  /** Push a snapshot, run the mutation, mark the form modified. */
  commit: (mutation: () => void) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const DEFAULT_VALUE: HistoryContextValue = {
  pushSnapshot: () => {},
  commit: (mutation) => mutation(),
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
}

const Ctx = createContext<HistoryContextValue>(DEFAULT_VALUE)

export const useEditorHistory = () => useContext(Ctx)

const MAX_HISTORY = 50

/**
 * Snapshot-based undo/redo. In-memory, capped at MAX_HISTORY entries,
 * resets on overlay unmount. Linear history — new edits after an undo
 * clear the redo stack.
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
  // Refs mirror the stacks so undo/redo can read latest values without
  // calling setState inside another setState updater (React 18+ flags
  // that as "set state during render").
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

  const commit = useCallback(
    (mutation: () => void) => {
      pushSnapshot()
      mutation()
      setModified(true)
    },
    [pushSnapshot, setModified],
  )

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
      commit,
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
    }),
    [pushSnapshot, commit, undo, redo, undoStack.length, redoStack.length],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
