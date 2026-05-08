'use client'

import { useEffect, type RefObject } from 'react'
import { HoverToolbarController, type HoverToolbarOptions } from '../preview/HoverToolbarController'
import { ACTIVE_CLASS, ACTIVE_SELECTOR } from '../internal/dom'
import { TOOLBAR_ID, setHoverVars } from '../preview/hover-css'
import type { BlockActionMessage } from '../preview/protocol'
import { getSameOriginDocument } from '../internal/iframe'
import type { PreviewBindingSettings } from './usePreviewBinding'

export type UsePreviewSettingsSyncArgs = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  controllerRef: RefObject<HoverToolbarController | null>
  isBoundRef: RefObject<boolean>
  settings: PreviewBindingSettings
  onBlockAction: (id: string, action: BlockActionMessage['action']) => void
}

/**
 * Pushes setting changes (hover colors, toolbar visibility/position) into
 * the iframe without recreating the controller — that would lose the
 * current selection.
 */
export const usePreviewSettingsSync = ({
  iframeRef,
  controllerRef,
  isBoundRef,
  settings,
  onBlockAction,
}: UsePreviewSettingsSyncArgs): void => {
  const {
    hoverColorTopLevel,
    hoverColorNested,
    hoverOutlineWidth,
    showHoverToolbar,
    hoverToolbarPosition,
  } = settings

  useEffect(() => {
    if (!isBoundRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = getSameOriginDocument(iframe)
    if (!doc) return

    setHoverVars(doc, {
      topColor: hoverColorTopLevel,
      nestedColor: hoverColorNested,
      outlineWidth: hoverOutlineWidth,
    })

    if (showHoverToolbar) {
      const next: HoverToolbarOptions = {
        position: hoverToolbarPosition,
        outlineWidth: hoverOutlineWidth,
        onAction: onBlockAction,
      }
      if (controllerRef.current) {
        controllerRef.current.update(next)
      } else {
        controllerRef.current = new HoverToolbarController(doc, next)
      }
    } else if (controllerRef.current) {
      controllerRef.current.destroy()
      controllerRef.current = null
      // Defensive: drop residue if styles outlived a previous controller.
      doc.getElementById(TOOLBAR_ID)?.remove()
      doc.querySelectorAll(ACTIVE_SELECTOR).forEach((el) => el.classList.remove(ACTIVE_CLASS))
    }
  }, [
    iframeRef,
    controllerRef,
    isBoundRef,
    hoverColorTopLevel,
    hoverColorNested,
    hoverOutlineWidth,
    showHoverToolbar,
    hoverToolbarPosition,
    onBlockAction,
  ])
}
