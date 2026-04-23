'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, useDocumentInfo, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay'

type Pref = { open?: boolean }

const prefKey = (collectionSlug?: string, globalSlug?: string) =>
  `better-editor:${collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug ?? 'unknown'}`}`

const LayoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="14" y1="4" x2="14" y2="20" />
  </svg>
)

export type LiveEditorToggleProps = {
  blocksField: string
  topLevelBlocksSelector: string
}

/**
 * Toggle button rendered in the document's `beforeDocumentControls` slot.
 * Opening the editor portals the LiveEditorOverlay into Payload's
 * `__main-wrapper`, so admin chrome + status row stay visible.
 */
export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({
  blocksField,
  topLevelBlocksSelector,
}) => {
  const [open, setOpen] = useState(false)
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
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

  useEffect(() => {
    if (!open) return
    if (typeof document === 'undefined') return

    const main =
      document.querySelector<HTMLElement>(
        'main[class*="collection-edit"] [class*="__main-wrapper"]',
      ) ||
      document.querySelector<HTMLElement>(
        'main[class*="global-edit"] [class*="__main-wrapper"]',
      )

    if (!main) return

    const prevPosition = main.style.position
    const prevOverflow = main.style.overflow
    if (!main.style.position) main.style.position = 'relative'
    main.style.overflow = 'hidden'

    setMountNode(main)

    return () => {
      main.style.position = prevPosition
      main.style.overflow = prevOverflow
      setMountNode(null)
    }
  }, [open])

  return (
    <>
      <Button
        buttonStyle="secondary"
        icon={<LayoutIcon />}
        iconPosition="left"
        iconStyle="without-border"
        onClick={handleToggle}
      >
        {open ? 'Close Better Editor' : 'Open Better Editor'}
      </Button>
      {open && mountNode
        ? createPortal(
            <LiveEditorOverlay
              onClose={() => setOpen(false)}
              blocksField={blocksField}
              topLevelBlocksSelector={topLevelBlocksSelector}
            />,
            mountNode,
          )
        : null}
    </>
  )
}
