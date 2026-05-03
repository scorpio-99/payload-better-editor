'use client'

import { useEffect } from 'react'
import { useEditorHistory } from '../useEditorHistory'

export type UseOverlayKeyboardArgs = {
  onClose: () => void
  history: ReturnType<typeof useEditorHistory>
}

export const useOverlayKeyboard = ({ onClose, history }: UseOverlayKeyboardArgs): void => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) {
          history.redo()
        } else {
          history.undo()
        }
      } else if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        history.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, history])
}
