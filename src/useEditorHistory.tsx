'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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

type HistoryState = {
  undo: Snapshot[]
  redo: Snapshot[]
}

type HistoryAction =
  | { type: 'push'; snapshot: Snapshot }
  | { type: 'undo'; current: Snapshot }
  | { type: 'redo'; current: Snapshot }

const initialState: HistoryState = { undo: [], redo: [] }

const reducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  switch (action.type) {
    case 'push': {
      const next = [...state.undo, action.snapshot]
      return {
        undo: next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next,
        redo: [],
      }
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
    default:
      return state
  }
}

export const EditorHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fields] = useAllFormFields()
  const fieldsRef = useRef(fields)
  useEffect(() => {
    fieldsRef.current = fields
  }, [fields])

  const { dispatchFields, setModified } = useForm()
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const restoringRef = useRef(false)

  const pushSnapshot = useCallback(() => {
    if (restoringRef.current) return
    dispatch({ type: 'push', snapshot: fieldsRef.current })
  }, [])

  const commit = useCallback(
    (mutation: () => void) => {
      pushSnapshot()
      mutation()
      setModified(true)
    },
    [pushSnapshot, setModified],
  )

  const restore = useCallback(
    (direction: 'undo' | 'redo') => {
      const stack = stateRef.current[direction]
      if (stack.length === 0) return
      const target = stack[stack.length - 1]
      dispatch({ type: direction, current: fieldsRef.current })
      restoringRef.current = true
      dispatchFields({ type: 'REPLACE_STATE', state: target })
      setModified(true)
      setTimeout(() => {
        restoringRef.current = false
      }, 0)
    },
    [dispatchFields, setModified],
  )
  const undo = useCallback(() => restore('undo'), [restore])
  const redo = useCallback(() => restore('redo'), [restore])

  const value = useMemo<HistoryContextValue>(
    () => ({
      pushSnapshot,
      commit,
      undo,
      redo,
      canUndo: state.undo.length > 0,
      canRedo: state.redo.length > 0,
    }),
    [pushSnapshot, commit, undo, redo, state.undo.length, state.redo.length],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
