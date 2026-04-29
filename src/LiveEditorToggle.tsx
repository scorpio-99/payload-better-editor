'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, useDocumentInfo, usePreferences } from '@payloadcms/ui'
import { LiveEditorOverlay } from './LiveEditorOverlay'
import { LayoutIcon } from './icons'

type Pref = { open?: boolean }

const prefKey = (collectionSlug?: string, globalSlug?: string) =>
  `better-editor:${collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug ?? 'unknown'}`}`

export type LiveEditorToggleProps = {
  blocksField: string
}

/**
 * Toggle button rendered in the document's `beforeDocumentControls` slot.
 * Opening the editor portals the LiveEditorOverlay into Payload's
 * `__main-wrapper`, so admin chrome + status row stay visible.
 */
export const LiveEditorToggle: React.FC<LiveEditorToggleProps> = ({
  blocksField,
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

    const html = document.documentElement
    const body = document.body

    const prevPosition = main.style.position
    const prevOverflow = main.style.overflow
    const prevHeight = main.style.height
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    if (!main.style.position) main.style.position = 'relative'
    main.style.overflow = 'hidden'

    // Lock the outer page scroll so wheel events that escape the iframe
    // or sidebar can't scroll the admin shell along with them.
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    // Clamp the wrapper's height to the viewport from its current top.
    // Without this, the wrapper grows with the underlying form (often
    // thousands of pixels), the absolutely-positioned overlay inherits
    // that height, and neither the iframe nor the sidebar ever overflow
    // their own boxes — instead the page scrolls everything together.
    const updateHeight = () => {
      const top = main.getBoundingClientRect().top
      main.style.height = `${Math.max(0, window.innerHeight - top)}px`
    }
    updateHeight()

    window.addEventListener('resize', updateHeight)

    setMountNode(main)

    return () => {
      window.removeEventListener('resize', updateHeight)
      main.style.position = prevPosition
      main.style.overflow = prevOverflow
      main.style.height = prevHeight
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
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
            />,
            mountNode,
          )
        : null}
    </>
  )
}
