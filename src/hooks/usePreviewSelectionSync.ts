'use client'

import { useEffect, useMemo, type RefObject } from 'react'
import { useAllFormFields, useDocumentEvents, useDocumentInfo } from '@payloadcms/ui'
import { HoverToolbarController } from '../preview/HoverToolbarController'
import { INTERACT_BODY_ATTR } from '../preview/hover-css'
import { useEditorHistory } from '../state/useEditorHistory'

export type UsePreviewSelectionSyncArgs = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  controllerRef: RefObject<HoverToolbarController | null>
  selectedBlockPath: string | null
  interactMode: boolean
  previewURL: string | undefined
}

const getSameOriginDocument = (iframe: HTMLIFrameElement): Document | null => {
  try {
    return iframe.contentDocument
  } catch {
    return null
  }
}

/**
 * Bridges three iframe-side concerns to admin state: live-preview document
 * events, the interact-mode body attribute, and selection sync between the
 * sidebar and the in-iframe hover toolbar.
 */
export const usePreviewSelectionSync = ({
  iframeRef,
  controllerRef,
  selectedBlockPath,
  interactMode,
  previewURL,
}: UsePreviewSelectionSyncArgs): void => {
  const { mostRecentUpdate } = useDocumentEvents()
  const { id } = useDocumentInfo()

  const previewOrigin = useMemo(() => {
    if (!previewURL) return null
    try {
      return new URL(previewURL, window.location.origin).origin
    } catch {
      return null
    }
  }, [previewURL])

  useEffect(() => {
    if (!mostRecentUpdate || !previewOrigin) return
    if (id != null && mostRecentUpdate.id !== id) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'payload-document-event' },
      previewOrigin,
    )
  }, [iframeRef, mostRecentUpdate, id, previewOrigin])

  const [allFields] = useAllFormFields()
  const selectedBlockId = useMemo<string | null>(() => {
    if (!selectedBlockPath) return null
    const v = allFields[`${selectedBlockPath}.id`]?.value
    return typeof v === 'string' ? v : null
  }, [allFields, selectedBlockPath])

  // Toggle the iframe body attribute that gates hover/active CSS + clicks.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = getSameOriginDocument(iframe)
    if (!doc) return
    if (interactMode) doc.body.setAttribute(INTERACT_BODY_ATTR, '')
    else doc.body.removeAttribute(INTERACT_BODY_ATTR)
  }, [iframeRef, interactMode])

  const { mutationToken } = useEditorHistory()
  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) return
    if (!selectedBlockId || interactMode) {
      controller.deselect()
      return
    }
    // Defer one frame so the iframe DOM has settled after a mutation.
    const view = iframeRef.current?.contentWindow
    const raf = view?.requestAnimationFrame(() => controller.select(selectedBlockId))
    return () => {
      if (raf !== undefined) view?.cancelAnimationFrame(raf)
    }
  }, [iframeRef, controllerRef, selectedBlockId, mutationToken, interactMode])
}
