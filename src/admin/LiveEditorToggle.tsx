'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentInfo, useLivePreviewContext, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay'
import { useMainWrapperPortal } from '../hooks/useMainWrapperPortal'
import { buildStorageKeys } from '../internal/storage-keys'
import { LayoutIcon } from './icons'
import { useBetterEditorT } from '../i18n/useBetterEditorT'

type Pref = { open?: boolean }

export type LiveEditorToggleProps = {
  blocksField: string
  adminPortalSelector?: string
  storageNamespace?: string
}

export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({
  blocksField,
  adminPortalSelector,
  storageNamespace,
}) => {
  const [open, setOpen] = useState(false)
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { previewURL } = useLivePreviewContext()
  const { getPreference, setPreference } = usePreferences()
  const storageKeys = useMemo(() => buildStorageKeys(storageNamespace), [storageNamespace])
  const prefKey = storageKeys.togglePreference(collectionSlug, globalSlug)

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

  const mountNode = useMainWrapperPortal(open, adminPortalSelector)
  const t = useBetterEditorT()
  const label = open ? t.toggle.close : t.toggle.open

  // Mirror Payload's official live-preview behaviour: only surface the
  // toggle once a previewURL is actually resolvable (collection has
  // `admin.livePreview.url` configured AND the document has the data
  // the URL function depends on, e.g. slug). Hiding the button avoids
  // the misleading "Loading preview URL…" / "not configured" empty
  // states inside the overlay entirely.
  if (!previewURL) return null

  return (
    <>
      <button
        aria-label={label}
        aria-pressed={open}
        className="preview-btn"
        onClick={handleToggle}
        title={label}
        type="button"
        style={
          open
            ? {
                width: 'auto',
                borderColor: 'var(--theme-elevation-300)',
                backgroundColor: 'var(--theme-elevation-100)',
              }
            : {width: 'auto'}
        }
      >
        <span style={{
          color: 'var(--theme-elevation-700)',
          display: 'inline-block',
          marginRight: '0.5em'
        }}>{label}</span>
        <LayoutIcon />
      </button>

      {open && mountNode
        ? createPortal(
            <LiveEditorOverlay
              onClose={handleClose}
              blocksField={blocksField}
              storageNamespace={storageNamespace}
              adminPortalSelector={adminPortalSelector}
            />,
            mountNode,
          )
        : null}
    </>
  )
}
