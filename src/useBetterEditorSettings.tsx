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

const Ctx = createContext<BetterEditorSettings>(DEFAULT_SETTINGS)

export const useBetterEditorSettings = () => useContext(Ctx)

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

const str = <T extends string>(v: unknown, fallback: T, allowed?: readonly T[]): T => {
  if (typeof v !== 'string' || !v) return fallback
  if (allowed && !allowed.includes(v as T)) return fallback
  return v as T
}

const POSITIONS = ['left', 'right'] as const
const TOOLBAR_POSITIONS = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
] as const

/** Fetches the BetterEditorSettings global once; defaults during fetch. */
export const BetterEditorSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<BetterEditorSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/globals/${BETTER_EDITOR_SETTINGS_SLUG}?depth=0`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data || typeof data !== 'object') return
        const d = data as Record<string, unknown>
        setSettings({
          sidebarPosition: str(d.sidebarPosition, DEFAULT_SETTINGS.sidebarPosition, POSITIONS),
          forceFullWidthFields:
            typeof d.forceFullWidthFields === 'boolean'
              ? d.forceFullWidthFields
              : DEFAULT_SETTINGS.forceFullWidthFields,
          tabletWidth: num(d.tabletWidth, DEFAULT_SETTINGS.tabletWidth),
          mobileWidth: num(d.mobileWidth, DEFAULT_SETTINGS.mobileWidth),
          hoverColorTopLevel:
            (typeof d.hoverColorTopLevel === 'string' && d.hoverColorTopLevel) ||
            DEFAULT_SETTINGS.hoverColorTopLevel,
          hoverColorNested:
            (typeof d.hoverColorNested === 'string' && d.hoverColorNested) ||
            DEFAULT_SETTINGS.hoverColorNested,
          hoverOutlineWidth: num(d.hoverOutlineWidth, DEFAULT_SETTINGS.hoverOutlineWidth),
          showHoverToolbar:
            typeof d.showHoverToolbar === 'boolean'
              ? d.showHoverToolbar
              : DEFAULT_SETTINGS.showHoverToolbar,
          hoverToolbarPosition: str(
            d.hoverToolbarPosition,
            DEFAULT_SETTINGS.hoverToolbarPosition,
            TOOLBAR_POSITIONS,
          ),
        })
      })
      .catch(() => {
        // keep defaults
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>
}
