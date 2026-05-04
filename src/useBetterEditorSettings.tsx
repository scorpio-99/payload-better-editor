'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BETTER_EDITOR_SETTINGS_SLUG } from './global'
import {
  DEFAULT_BETTER_EDITOR_SETTINGS,
  HOVER_TOOLBAR_POSITIONS,
  SIDEBAR_POSITIONS,
  type HoverToolbarPosition,
  type SidebarPosition,
} from './internal/constants'

export type { HoverToolbarPosition }

export type BetterEditorSettings = {
  sidebarPosition: SidebarPosition
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

const DEFAULTS: BetterEditorSettings = { ...DEFAULT_BETTER_EDITOR_SETTINGS }

const Ctx = createContext<BetterEditorSettings>(DEFAULTS)

export const useBetterEditorSettings = (): BetterEditorSettings => useContext(Ctx)

const pickEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

const pickBool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

const pickFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const pickNonEmptyString = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.length > 0 ? value : fallback

const normalizeSettings = (raw: unknown): BetterEditorSettings => {
  if (!raw || typeof raw !== 'object') return DEFAULTS
  const d = raw as Partial<BetterEditorSettings>
  return {
    sidebarPosition: pickEnum(d.sidebarPosition, SIDEBAR_POSITIONS, DEFAULTS.sidebarPosition),
    forceFullWidthFields: pickBool(d.forceFullWidthFields, DEFAULTS.forceFullWidthFields),
    tabletWidth: pickFiniteNumber(d.tabletWidth, DEFAULTS.tabletWidth),
    mobileWidth: pickFiniteNumber(d.mobileWidth, DEFAULTS.mobileWidth),
    hoverColorTopLevel: pickNonEmptyString(d.hoverColorTopLevel, DEFAULTS.hoverColorTopLevel),
    hoverColorNested: pickNonEmptyString(d.hoverColorNested, DEFAULTS.hoverColorNested),
    hoverOutlineWidth: pickFiniteNumber(d.hoverOutlineWidth, DEFAULTS.hoverOutlineWidth),
    showHoverToolbar: pickBool(d.showHoverToolbar, DEFAULTS.showHoverToolbar),
    hoverToolbarPosition: pickEnum(
      d.hoverToolbarPosition,
      HOVER_TOOLBAR_POSITIONS,
      DEFAULTS.hoverToolbarPosition,
    ),
  }
}

export const BetterEditorSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<BetterEditorSettings>(DEFAULTS)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/globals/${BETTER_EDITOR_SETTINGS_SLUG}?depth=0`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<unknown>) : null))
      .then((data) => {
        if (data == null) return
        setSettings(normalizeSettings(data))
      })
      .catch((err: unknown) => {
        // Aborts on unmount are expected; surface anything else in dev so a
        // broken settings endpoint doesn't fail silently.
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[better-editor] failed to load settings global', err)
        }
      })

    return () => {
      controller.abort()
    }
  }, [])

  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>
}
