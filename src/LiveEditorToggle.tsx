'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentInfo, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay'
import { useMainWrapperPortal } from './hooks/useMainWrapperPortal'
import { togglePreferenceKey } from './internal/constants'
import { LayoutIcon } from './icons'

type Pref = { open?: boolean }

export type LiveEditorToggleProps = {
  blocksField: string
}

export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({
  blocksField,
}) => {
  const [open, setOpen] = useState(false)
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { getPreference, setPreference } = usePreferences()
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const key = togglePreferenceKey(collectionSlug, globalSlug)
    void getPreference<Pref>(key).then((pref) => {
      if (cancelled) return
      if (pref?.open) setOpen(true)
      hasHydratedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [collectionSlug, globalSlug, getPreference])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    const key = togglePreferenceKey(collectionSlug, globalSlug)
    void setPreference<Pref>(key, { open }, true)
  }, [open, collectionSlug, globalSlug, setPreference])

  const handleToggle = useCallback(() => {
    setOpen((v) => !v)
  }, [])

  const mountNode = useMainWrapperPortal(open)

  return (
    <>
      <button
        aria-label={open ? 'Close Better Editor' : 'Open Better Editor'}
        className="preview-btn"
        onClick={handleToggle}
        title={open ? 'Close Better Editor' : 'Open Better Editor'}
        type="button"
      >
        <LayoutIcon />
      </button>

      {open && mountNode
        ? createPortal(
            <LiveEditorOverlay
              onClose={() => setOpen(false)}
              blocksField={blocksField}
            />,
            mountNode,
          )
        : null}
    </>
  )
}
