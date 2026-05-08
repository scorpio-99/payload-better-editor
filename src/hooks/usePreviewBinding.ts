'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { HoverToolbarController } from '../preview/HoverToolbarController'
import { installClickToFocus } from '../preview/installClickToFocus'
import { installHoverStyles } from '../preview/installHoverStyles'
import type { BlockActionMessage } from '../preview/protocol'
import { BLOCK_ID_SELECTOR } from '../internal/dom'
import { getSameOriginDocument } from '../internal/iframe'
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
  /** Reports the number of `[data-better-editor-id]` elements found in
   * the iframe right after binding. PreviewFrame uses 0 to surface a
   * setup-error banner. */
  onBlockProbeCount?: (count: number) => void
}

export type UsePreviewBindingReturn = {
  controllerRef: RefObject<HoverToolbarController | null>
  isBoundRef: RefObject<boolean>
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
  onBlockProbeCount,
}: UsePreviewBindingArgs): UsePreviewBindingReturn => {
  const teardownRef = useRef<(() => void) | null>(null)
  const controllerRef = useRef<HoverToolbarController | null>(null)
  const isBoundRef = useRef(false)
  const settingsRef = useLatestRef(settings)
  const onFocusBlockRef = useLatestRef(onFocusBlock)
  const onBlockActionRef = useLatestRef(onBlockAction)
  const onLoadingChangeRef = useLatestRef(onLoadingChange)
  const onBlockProbeCountRef = useLatestRef(onBlockProbeCount)

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

      // Probe for [data-better-editor-id] elements. Zero means the
      // consumer forgot to spread getBlockProps() on their block wrappers
      // — the editor silently degrades to "preview only", so PreviewFrame
      // shows a setup-error banner. Safe to probe synchronously now that
      // about:blank documents are skipped above.
      const blockCount = doc.querySelectorAll(BLOCK_ID_SELECTOR).length
      onBlockProbeCountRef.current?.(blockCount)
      if (blockCount === 0 && process.env.NODE_ENV !== 'production') {
        console.warn(
          "[better-editor] no [data-better-editor-id] elements found in the preview iframe — wrap your blocks with `getBlockProps(block)` from 'payload-better-editor/client' so click-to-edit works.",
        )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
    [],
  )

  // Bind once on mount; teardown on unmount. All inputs flow through
  // stable refs, so the load listener doesn't need to re-attach.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      const doc = getSameOriginDocument(iframe)
      if (!doc) {
        onLoadingChangeRef.current(false)
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[better-editor] preview iframe is cross-origin — click-to-edit, hover styles, and the in-iframe toolbar are disabled. Serve your preview URL from the same origin as the Payload admin.',
          )
        }
        return
      }
      // Fresh iframes report readyState='complete' on their `about:blank`
      // document before `src` has navigated. Binding there would probe an
      // empty body and falsely flash the setup-error banner. Wait for the
      // real `load` event with a real URL instead.
      const href = doc.location.href
      if (!href || href === 'about:blank') return
      onLoadingChangeRef.current(false)
      bindToDocument(doc)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
  }, [])

  return { controllerRef, isBoundRef }
}
