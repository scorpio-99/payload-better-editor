'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { HoverToolbarController } from '../preview/HoverToolbarController'
import { installClickToFocus } from '../preview/installClickToFocus'
import { installHoverStyles } from '../preview/installHoverStyles'
import type { BlockActionMessage } from '../preview/protocol'
import { BLOCK_ID_SELECTOR } from '../internal/dom'
import { useLatestRef } from './useLatestRef'

export type PreviewBindingSettings = {
  hoverColorTopLevel: string
  hoverColorNested: string
  hoverOutlineWidth: number
  showHoverToolbar: boolean
  hoverToolbarPosition: import('../internal/constants').HoverToolbarPosition
}

export type UsePreviewBindingArgs = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  settings: PreviewBindingSettings
  interactModeRef: RefObject<boolean>
  onFocusBlock: (id: string) => void
  onBlockAction: (id: string, action: BlockActionMessage['action']) => void
  onLoadingChange: (loading: boolean) => void
}

export type UsePreviewBindingReturn = {
  controllerRef: RefObject<HoverToolbarController | null>
  isBoundRef: RefObject<boolean>
}

const getSameOriginDocument = (iframe: HTMLIFrameElement): Document | null => {
  try {
    return iframe.contentDocument
  } catch {
    return null
  }
}

/**
 * Owns the iframe load → install styles + click handler + hover toolbar
 * lifecycle. Idempotent: tears down previous bindings before installing
 * new ones, and unbinds on unmount.
 */
export const usePreviewBinding = ({
  iframeRef,
  settings,
  interactModeRef,
  onFocusBlock,
  onBlockAction,
  onLoadingChange,
}: UsePreviewBindingArgs): UsePreviewBindingReturn => {
  const teardownRef = useRef<(() => void) | null>(null)
  const controllerRef = useRef<HoverToolbarController | null>(null)
  const isBoundRef = useRef(false)
  const settingsRef = useLatestRef(settings)
  const onFocusBlockRef = useLatestRef(onFocusBlock)
  const onBlockActionRef = useLatestRef(onBlockAction)
  const onLoadingChangeRef = useLatestRef(onLoadingChange)

  const bindToDocument = useCallback(
    (doc: Document) => {
      teardownRef.current?.()
      controllerRef.current?.destroy()
      controllerRef.current = null

      const s = settingsRef.current

      const removeStyles = installHoverStyles(doc, {
        topColor: s.hoverColorTopLevel,
        nestedColor: s.hoverColorNested,
        outlineWidth: s.hoverOutlineWidth,
      })
      const removeClick = installClickToFocus(doc, (id) => onFocusBlockRef.current(id), {
        isEnabled: () => !interactModeRef.current,
      })

      if (s.showHoverToolbar) {
        controllerRef.current = new HoverToolbarController(doc, {
          position: s.hoverToolbarPosition,
          outlineWidth: s.hoverOutlineWidth,
          onAction: (id, action) => onBlockActionRef.current(id, action),
        })
      }

      // Dev sanity: missing data-better-editor-id elements means the consumer
      // forgot to spread getBlockProps() on their block wrappers — without
      // that the editor silently degrades to "preview only".
      if (process.env.NODE_ENV !== 'production') {
        const count = doc.querySelectorAll(BLOCK_ID_SELECTOR).length
        if (count === 0) {
          console.warn(
            "[better-editor] no [data-better-editor-id] elements found in the preview iframe — wrap your blocks with `getBlockProps(block)` from 'payload-better-editor/client' so click-to-edit works.",
          )
        }
      }

      isBoundRef.current = true
      teardownRef.current = () => {
        removeStyles()
        removeClick()
        controllerRef.current?.destroy()
        controllerRef.current = null
        isBoundRef.current = false
      }
    },
    [interactModeRef, settingsRef, onFocusBlockRef, onBlockActionRef],
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      onLoadingChangeRef.current(false)
      const doc = getSameOriginDocument(iframe)
      if (doc) bindToDocument(doc)
    }

    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      onLoad()
    }
    iframe.addEventListener('load', onLoad)

    return () => {
      iframe.removeEventListener('load', onLoad)
      teardownRef.current?.()
      teardownRef.current = null
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [iframeRef, bindToDocument, onLoadingChangeRef])

  return { controllerRef, isBoundRef }
}
