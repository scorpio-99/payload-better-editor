'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BETTER_EDITOR_SETTINGS_SLUG } from '../global'
import {
  DEFAULT_BETTER_EDITOR_SETTINGS,
  HOVER_TOOLBAR_POSITIONS,
  SIDEBAR_POSITIONS,
  type HoverToolbarPosition,
  type SidebarPosition,
} from '../internal/constants'

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

const pick = <T,>(value: unknown, isValid: (v: unknown) => v is T, fallback: T): T =>
  isValid(value) ? value : fallback

const isOneOf = <T extends string>(allowed: readonly T[]) =>
  (v: unknown): v is T => typeof v === 'string' && (allowed as readonly string[]).includes(v)

const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0

const normalizeSettings = (raw: unknown): BetterEditorSettings => {
  if (!raw || typeof raw !== 'object') return DEFAULTS
  const d = raw as Partial<BetterEditorSettings>
  return {
    sidebarPosition: pick(d.sidebarPosition, isOneOf(SIDEBAR_POSITIONS), DEFAULTS.sidebarPosition),
    forceFullWidthFields: pick(d.forceFullWidthFields, isBool, DEFAULTS.forceFullWidthFields),
    tabletWidth: pick(d.tabletWidth, isFiniteNumber, DEFAULTS.tabletWidth),
    mobileWidth: pick(d.mobileWidth, isFiniteNumber, DEFAULTS.mobileWidth),
    hoverColorTopLevel: pick(d.hoverColorTopLevel, isNonEmptyString, DEFAULTS.hoverColorTopLevel),
    hoverColorNested: pick(d.hoverColorNested, isNonEmptyString, DEFAULTS.hoverColorNested),
    hoverOutlineWidth: pick(d.hoverOutlineWidth, isFiniteNumber, DEFAULTS.hoverOutlineWidth),
    showHoverToolbar: pick(d.showHoverToolbar, isBool, DEFAULTS.showHoverToolbar),
    hoverToolbarPosition: pick(
      d.hoverToolbarPosition,
      isOneOf(HOVER_TOOLBAR_POSITIONS),
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
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (data != null) setSettings(normalizeSettings(data))
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[better-editor] failed to load settings global', err)
        }
      })

    return () => controller.abort()
  }, [])

  const value = useMemo(() => settings, [settings])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
