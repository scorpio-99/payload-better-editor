'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BETTER_EDITOR_SETTINGS_SLUG } from './global'

export type HoverToolbarPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'

export type BetterEditorSettings = {
  sidebarPosition: 'left' | 'right'
  forceFullWidthFields: boolean
  tabletWidth: number
  mobileWidth: number
  hoverColorTopLevel: string
  hoverColorNested: string
  hoverOutlineWidth: number
  showHoverToolbar: boolean
  hoverToolbarPosition: HoverToolbarPosition
}

export const DEFAULT_SIDEBAR_WIDTH = 400
export const MIN_SIDEBAR_WIDTH = 250
export const MAX_SIDEBAR_WIDTH = 800

export const DEFAULT_SETTINGS: BetterEditorSettings = {
  sidebarPosition: 'right',
  forceFullWidthFields: true,
  tabletWidth: 800,
  mobileWidth: 400,
  hoverColorTopLevel: '#3b82f6',
  hoverColorNested: '#f59e0b',
  hoverOutlineWidth: 2,
  showHoverToolbar: true,
  hoverToolbarPosition: 'top-right',
}

const SIDEBAR_POSITIONS: readonly BetterEditorSettings['sidebarPosition'][] = ['left', 'right']
const TOOLBAR_POSITIONS: readonly HoverToolbarPosition[] = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
]

const Ctx = createContext<BetterEditorSettings>(DEFAULT_SETTINGS)

export const useBetterEditorSettings = () => useContext(Ctx)

export const BetterEditorSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<BetterEditorSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/globals/${BETTER_EDITOR_SETTINGS_SLUG}?depth=0`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== 'object') return
        const d = data as Partial<BetterEditorSettings>

        const sidebarPosition =
          d.sidebarPosition && SIDEBAR_POSITIONS.includes(d.sidebarPosition)
            ? d.sidebarPosition
            : DEFAULT_SETTINGS.sidebarPosition

        const hoverToolbarPosition =
          d.hoverToolbarPosition && TOOLBAR_POSITIONS.includes(d.hoverToolbarPosition)
            ? d.hoverToolbarPosition
            : DEFAULT_SETTINGS.hoverToolbarPosition

        setSettings({
          sidebarPosition,
          forceFullWidthFields:
            typeof d.forceFullWidthFields === 'boolean'
              ? d.forceFullWidthFields
              : DEFAULT_SETTINGS.forceFullWidthFields,
          tabletWidth:
            typeof d.tabletWidth === 'number' && Number.isFinite(d.tabletWidth)
              ? d.tabletWidth
              : DEFAULT_SETTINGS.tabletWidth,
          mobileWidth:
            typeof d.mobileWidth === 'number' && Number.isFinite(d.mobileWidth)
              ? d.mobileWidth
              : DEFAULT_SETTINGS.mobileWidth,
          hoverColorTopLevel:
            (typeof d.hoverColorTopLevel === 'string' && d.hoverColorTopLevel) ||
            DEFAULT_SETTINGS.hoverColorTopLevel,
          hoverColorNested:
            (typeof d.hoverColorNested === 'string' && d.hoverColorNested) ||
            DEFAULT_SETTINGS.hoverColorNested,
          hoverOutlineWidth:
            typeof d.hoverOutlineWidth === 'number' && Number.isFinite(d.hoverOutlineWidth)
              ? d.hoverOutlineWidth
              : DEFAULT_SETTINGS.hoverOutlineWidth,
          showHoverToolbar:
            typeof d.showHoverToolbar === 'boolean'
              ? d.showHoverToolbar
              : DEFAULT_SETTINGS.showHoverToolbar,
          hoverToolbarPosition,
        })
      })
      .catch(() => {})

    return () => {
      controller.abort()
    }
  }, [])

  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>
}
