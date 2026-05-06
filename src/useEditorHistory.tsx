'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { FormState } from 'payload'
import { useAllFormFields, useForm } from '@payloadcms/ui'

type HistoryContextValue = {
  pushSnapshot: () => void
  /** Push a snapshot, run the mutation, mark the form modified. */
  commit: (mutation: () => void) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  mutationToken: number
}

const noop = (): void => {}

const DEFAULT_VALUE: HistoryContextValue = {
  pushSnapshot: noop,
  commit: (mutation) => mutation(),
  undo: noop,
  redo: noop,
  canUndo: false,
  canRedo: false,
  mutationToken: 0,
}

const Ctx = createContext<HistoryContextValue>(DEFAULT_VALUE)

export const useEditorHistory = (): HistoryContextValue => useContext(Ctx)

const MAX_HISTORY = 50

type HistoryState = {
  undo: FormState[]
  redo: FormState[]
}

type HistoryAction =
  | { type: 'push'; snapshot: FormState }
  | { type: 'undo'; current: FormState }
  | { type: 'redo'; current: FormState }

const initialState: HistoryState = { undo: [], redo: [] }

const reducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  switch (action.type) {
    case 'push': {
      const next =
        state.undo.length >= MAX_HISTORY
          ? [...state.undo.slice(-(MAX_HISTORY - 1)), action.snapshot]
          : [...state.undo, action.snapshot]
      return { undo: next, redo: [] }
    }
    case 'undo': {
      if (state.undo.length === 0) return state
      return {
        undo: state.undo.slice(0, -1),
        redo: [...state.redo, action.current],
      }
    }
    case 'redo': {
      if (state.redo.length === 0) return state
      return {
        undo: [...state.undo, action.current],
        redo: state.redo.slice(0, -1),
      }
    }
  }
}

export const EditorHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fields] = useAllFormFields()
  const fieldsRef = useRef<FormState>(fields)
  fieldsRef.current = fields

  const { dispatchFields, setModified } = useForm()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [mutationToken, setMutationToken] = useState(0)
  const bumpMutationToken = useCallback(() => setMutationToken((n) => n + 1), [])
  const restoringRef = useRef(false)
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (restoreTimerRef.current !== null) clearTimeout(restoreTimerRef.current)
    },
    [],
  )

  const pushSnapshot = useCallback(() => {
    if (restoringRef.current) return
    dispatch({ type: 'push', snapshot: fieldsRef.current })
  }, [])

  const commit = useCallback(
    (mutation: () => void) => {
      pushSnapshot()
      mutation()
      setModified(true)
      bumpMutationToken()
    },
    [pushSnapshot, setModified, bumpMutationToken],
  )

  const restore = useCallback(
    (direction: 'undo' | 'redo', target: FormState) => {
      dispatch({ type: direction, current: fieldsRef.current })
      restoringRef.current = true
      dispatchFields({ type: 'REPLACE_STATE', state: target })
      setModified(true)
      // Cleared after the React commit so a transient pushSnapshot triggered
      // by the REPLACE_STATE effect cannot poison redo.
      if (restoreTimerRef.current !== null) clearTimeout(restoreTimerRef.current)
      restoreTimerRef.current = setTimeout(() => {
        restoringRef.current = false
        restoreTimerRef.current = null
      }, 0)
      bumpMutationToken()
    },
    [dispatchFields, setModified, bumpMutationToken],
  )

  const undo = useCallback(() => {
    const stack = state.undo
    if (stack.length === 0) return
    restore('undo', stack[stack.length - 1])
  }, [state.undo, restore])

  const redo = useCallback(() => {
    const stack = state.redo
    if (stack.length === 0) return
    restore('redo', stack[stack.length - 1])
  }, [state.redo, restore])

  const canUndo = state.undo.length > 0
  const canRedo = state.redo.length > 0

  const value = useMemo<HistoryContextValue>(
    () => ({ pushSnapshot, commit, undo, redo, canUndo, canRedo, mutationToken }),
    [pushSnapshot, commit, undo, redo, canUndo, canRedo, mutationToken],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
