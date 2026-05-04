'use client'

import { useEffect, useRef } from 'react'
import { useEditorHistory } from '../useEditorHistory'

export type UseOverlayKeyboardArgs = {
  onClose: () => void
  history: ReturnType<typeof useEditorHistory>
}

export const useOverlayKeyboard = ({ onClose, history }: UseOverlayKeyboardArgs): void => {
  const handlersRef = useRef<UseOverlayKeyboardArgs>({ onClose, history })

  useEffect(() => {
    handlersRef.current = { onClose, history }
  }, [onClose, history])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlersRef.current.onClose()
        return
      }
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        const h = handlersRef.current.history
        if (e.shiftKey) h.redo()
        else h.undo()
      } else if (k === 'y') {
        e.preventDefault()
        handlersRef.current.history.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
