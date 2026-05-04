'use client'

import React, { useCallback, useEffect, useState } from 'react'
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
  const [hydrated, setHydrated] = useState(false)
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { getPreference, setPreference } = usePreferences()
  const prefKey = togglePreferenceKey(collectionSlug, globalSlug)

  useEffect(() => {
    let cancelled = false
    setHydrated(false)
    void getPreference<Pref>(prefKey).then((pref) => {
      if (cancelled) return
      if (pref?.open) setOpen(true)
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [prefKey, getPreference])

  // Persist only after hydration so we don't clobber the stored value with
  // the initial `false` before the fetch resolves.
  useEffect(() => {
    if (!hydrated) return
    void setPreference<Pref>(prefKey, { open }, true)
  }, [hydrated, open, prefKey, setPreference])

  const handleToggle = useCallback(() => setOpen((v) => !v), [])
  const handleClose = useCallback(() => setOpen(false), [])

  const mountNode = useMainWrapperPortal(open)
  const label = open ? 'Close Better Editor' : 'Open Better Editor'

  return (
    <>
      <button
        aria-label={label}
        className="preview-btn"
        onClick={handleToggle}
        title={label}
        type="button"
      >
        <LayoutIcon />
      </button>

      {open && mountNode
        ? createPortal(
            <LiveEditorOverlay onClose={handleClose} blocksField={blocksField} />,
            mountNode,
          )
        : null}
    </>
  )
}
