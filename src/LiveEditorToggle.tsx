'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentInfo, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay'
import { useMainWrapperPortal } from './hooks/useMainWrapperPortal'
import { LayoutIcon } from './icons'

type Pref = { open?: boolean }

const prefKey = (collectionSlug?: string, globalSlug?: string) =>
  `better-editor:${collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug ?? 'unknown'}`}`

export type LiveEditorToggleProps = {
  blocksField: string
}

/** Open/close button + portal mount for the LiveEditorOverlay. */
export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({
  blocksField,
}) => {
  const [open, setOpen] = useState(false)
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { getPreference, setPreference } = usePreferences()
  const hasHydratedRef = useRef(false)

  // Restore the last saved open/closed state once, on mount per document.
  useEffect(() => {
    let cancelled = false
    const key = prefKey(collectionSlug, globalSlug)
    void getPreference<Pref>(key).then((pref) => {
      if (cancelled) return
      if (pref?.open) setOpen(true)
      hasHydratedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [collectionSlug, globalSlug, getPreference])

  // Persist changes after hydration — skip the initial default-state write
  // so we don't overwrite a stored `open: true` with `false` before the
  // initial read finishes.
  useEffect(() => {
    if (!hasHydratedRef.current) return
    const key = prefKey(collectionSlug, globalSlug)
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
