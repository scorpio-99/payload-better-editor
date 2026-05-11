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
}: UsePreviewBindingArgs): UsePreviewBindingReturn => {
  const teardownRef = useRef<(() => void) | null>(null)
  const controllerRef = useRef<HoverToolbarController | null>(null)
  const isBoundRef = useRef(false)
  // One-shot flags so dev-only console warnings don't repeat on every
  // iframe re-load during a single editor session.
  const warnedMissingBlocksRef = useRef(false)
  const warnedCrossOriginRef = useRef(false)
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

      // Dev-only sanity check: zero [data-better-editor-id] elements means
      // the consumer forgot to spread getBlockProps() on their block wrappers
      // (or the page just has no blocks yet — both look identical from here).
      // Warn at most once per editor session to avoid console spam.
      if (process.env.NODE_ENV !== 'production' && !warnedMissingBlocksRef.current) {
        const blockCount = doc.querySelectorAll(BLOCK_ID_SELECTOR).length
        if (blockCount === 0) {
          warnedMissingBlocksRef.current = true
          console.warn(
            "[better-editor] no [data-better-editor-id] elements found in the preview iframe — if your page has blocks, wrap them with `getBlockProps(block)` from 'payload-better-editor/client' so click-to-edit works.",
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
        if (process.env.NODE_ENV !== 'production' && !warnedCrossOriginRef.current) {
          warnedCrossOriginRef.current = true
          console.warn(
            '[better-editor] preview iframe is cross-origin — click-to-edit, hover styles, and the in-iframe toolbar are disabled. Serve your preview URL from the same origin as the Payload admin.',
          )
        }
        return
      }
      // Fresh iframes report readyState='complete' on their initial
      // `about:blank` document before `src` has navigated. Skip and wait
      // for the real `load` event so we don't bind to an empty body.
      // `doc.URL` is a non-nullable string on Document — safer than
      // `doc.location.href`, which Firefox can briefly expose as null.
      if (!doc.URL || doc.URL === 'about:blank') return
      onLoadingChangeRef.current(false)
      bindToDocument(doc)
    }

    const initialDoc = getSameOriginDocument(iframe)
    if (initialDoc && initialDoc.readyState === 'complete') {
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
