'use client'

import { useEffect } from 'react'
import { useEditorHistory } from '../state/useEditorHistory'
import { useLatestRef } from './useLatestRef'

export type UseOverlayKeyboardArgs = {
  onClose: () => void
  history: ReturnType<typeof useEditorHistory>
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

// Don't hijack Escape away from text inputs / native dropdowns / rich text
// editors — users expect it to clear/blur the field first.
const isEditableTarget = (el: Element | null): boolean =>
  !!el && (EDITABLE_TAGS.has(el.tagName) || (el as HTMLElement).isContentEditable === true)

export const useOverlayKeyboard = ({ onClose, history }: UseOverlayKeyboardArgs): void => {
  const handlersRef = useLatestRef({ onClose, history })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditableTarget(document.activeElement)) return
        handlersRef.current.onClose()
        return
      }
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
