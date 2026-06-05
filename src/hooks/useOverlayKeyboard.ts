'use client'

import { useEffect } from 'react'
import { useEditorHistory } from '../state/useEditorHistory'
import { useLatestRef } from './useLatestRef'

export type UseOverlayKeyboardArgs = {
  history: ReturnType<typeof useEditorHistory>
}

export const useOverlayKeyboard = ({ history }: UseOverlayKeyboardArgs): void => {
  const handlersRef = useLatestRef({ history })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        const { history: h } = handlersRef.current
        if (e.shiftKey) h.redo()
        else h.undo()
      } else if (k === 'y') {
        e.preventDefault()
        handlersRef.current.history.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlersRef])
}
