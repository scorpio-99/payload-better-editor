'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentInfo, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay'
import { useMainWrapperPortal } from './hooks/useMainWrapperPortal'
import { togglePreferenceKey } from './internal/storage-keys'
import { LayoutIcon } from './icons'

type Pref = { open?: boolean }

export type LiveEditorToggleProps = {
  blocksField: string
}

export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({ blocksField }) => {
  const [open, setOpen] = useState(false)
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { getPreference, setPreference } = usePreferences()
  const prefKey = togglePreferenceKey(collectionSlug, globalSlug)

  // Tracks the prefKey we've successfully hydrated against so persistence
  // can't fire with the initial `false` before the read resolves, and so
  // switching documents reseeds without clobbering the new doc's pref.
  const hydratedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    hydratedKeyRef.current = null
    void getPreference<Pref>(prefKey).then((pref) => {
      if (cancelled) return
      hydratedKeyRef.current = prefKey
      setOpen(Boolean(pref?.open))
    })
    return () => {
      cancelled = true
    }
  }, [prefKey, getPreference])

  useEffect(() => {
    if (hydratedKeyRef.current !== prefKey) return
    void setPreference<Pref>(prefKey, { open }, true)
  }, [open, prefKey, setPreference])

  const handleToggle = useCallback(() => setOpen((v) => !v), [])
  const handleClose = useCallback(() => setOpen(false), [])

  const mountNode = useMainWrapperPortal(open)
  const label = open ? 'Close Better Editor' : 'Open Better Editor'

  return (
    <>
      <button
        aria-label={label}
        aria-pressed={open}
        className="preview-btn"
        onClick={handleToggle}
        title={label}
        type="button"
        // While open, mirror Payload's preview-btn :hover styling so the
        // toggle reads as "active". Theme vars come from the admin shell.
        style={
          open
            ? {
                borderColor: 'var(--theme-elevation-300)',
                backgroundColor: 'var(--theme-elevation-100)',
              }
            : undefined
        }
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
