'use client'

import { useEffect, useRef } from 'react'
import { useEditorHistory } from '../useEditorHistory'

export type UseOverlayKeyboardArgs = {
  onClose: () => void
  history: ReturnType<typeof useEditorHistory>
}

const isEditableTarget = (el: Element | null): boolean => {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return (el as HTMLElement).isContentEditable === true
}

export const useOverlayKeyboard = ({ onClose, history }: UseOverlayKeyboardArgs): void => {
  // Mutable ref keeps the global keydown listener bound once across re-renders
  // while still calling the latest handlers.
  const handlersRef = useRef<UseOverlayKeyboardArgs>({ onClose, history })
  handlersRef.current = { onClose, history }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't hijack Escape away from text inputs / native dropdowns / rich
        // text editors — users expect it to clear/blur the field first.
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
  }, [])
}
