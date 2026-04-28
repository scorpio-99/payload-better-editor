'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BETTER_EDITOR_SETTINGS_SLUG } from './global'

export type BetterEditorSettings = {
  sidebarPosition: 'left' | 'right'
  forceFullWidthFields: boolean
  hoverColorTopLevel: string
  hoverColorNested: string
  hoverOutlineWidth: number
}

export const DEFAULT_SIDEBAR_WIDTH = 400
export const MIN_SIDEBAR_WIDTH = 250
export const MAX_SIDEBAR_WIDTH = 800

export const DEFAULT_SETTINGS: BetterEditorSettings = {
  sidebarPosition: 'right',
  forceFullWidthFields: true,
  hoverColorTopLevel: '#3b82f6',
  hoverColorNested: '#f59e0b',
  hoverOutlineWidth: 2,
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

/**
 * Fetches the BetterEditorSettings global once on mount and exposes it via
 * context. Renders children immediately with defaults so the editor is usable
 * during the (short) fetch window. If the request fails, defaults stick.
 */
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
          hoverColorTopLevel:
            (typeof d.hoverColorTopLevel === 'string' && d.hoverColorTopLevel) ||
            DEFAULT_SETTINGS.hoverColorTopLevel,
          hoverColorNested:
            (typeof d.hoverColorNested === 'string' && d.hoverColorNested) ||
            DEFAULT_SETTINGS.hoverColorNested,
          hoverOutlineWidth: num(d.hoverOutlineWidth, DEFAULT_SETTINGS.hoverOutlineWidth),
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
