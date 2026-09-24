'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentInfo, useLivePreviewContext, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay.js'
import { useMainWrapperPortal } from '../hooks/useMainWrapperPortal.js'
import { buildStorageKeys } from '../internal/storage-keys.js'
import { LayoutIcon } from './icons.js'
import { useBetterEditorT } from '../i18n/useBetterEditorT.js'
import '../styles/toggle.css'

type Pref = { open?: boolean }

export type LiveEditorToggleProps = {
  blocksField: string
  adminPortalSelector?: string
  storageNamespace?: string
  hideToggleLabel?: boolean
  /** Initial state for users without a saved preference for this entity. */
  defaultOpen?: boolean
}

export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({
  blocksField,
  adminPortalSelector,
  storageNamespace,
  hideToggleLabel,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(false)
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { previewURL } = useLivePreviewContext()
  const { getPreference, setPreference } = usePreferences()
  const storageKeys = useMemo(() => buildStorageKeys(storageNamespace), [storageNamespace])
  const prefKey = storageKeys.togglePreference(collectionSlug, globalSlug)

  // Tracks the prefKey we've successfully hydrated against so a toggle
  // before the read resolves isn't persisted, and so switching documents
  // reseeds without clobbering the new doc's pref.
  const hydratedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    hydratedKeyRef.current = null
    void getPreference<Pref>(prefKey).then((pref) => {
      if (cancelled) return
      hydratedKeyRef.current = prefKey
      // A saved choice (open or closed) always wins over the configured default.
      setOpen(typeof pref?.open === 'boolean' ? pref.open : defaultOpen)
    })
    return () => {
      cancelled = true
    }
  }, [prefKey, getPreference, defaultOpen])

  // Persist only explicit user actions, so a state seeded from `defaultOpen`
  // never becomes a saved preference and later config changes still apply.
  const persist = useCallback(
    (next: boolean) => {
      if (hydratedKeyRef.current !== prefKey) return
      void setPreference<Pref>(prefKey, { open: next }, true)
    },
    [prefKey, setPreference],
  )

  const handleToggle = useCallback(() => {
    const next = !open
    setOpen(next)
    persist(next)
  }, [open, persist])
  const handleClose = useCallback(() => {
    setOpen(false)
    persist(false)
  }, [persist])

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
        className="preview-btn better-editor-toggle"
        onClick={handleToggle}
        title={label}
        type="button"
      >
        {hideToggleLabel ? null : (
          <span className="better-editor-toggle__label">{label}</span>
        )}
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
