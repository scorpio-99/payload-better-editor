'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import {
  DesktopIcon,
  MobileIcon,
  ResponsiveIcon,
  TabletIcon,
  type IconProps,
} from './icons.js'
import { useBetterEditorT } from '../i18n/useBetterEditorT.js'

export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'responsive'

type Item = { id: Viewport; label: string; Icon: React.FC<IconProps> }

const ROOT_CLASS = 'better-editor-viewport'
const BTN_CLASS = `${ROOT_CLASS}__btn`

export type ViewportToggleProps = {
  value: Viewport
  onChange: (next: Viewport) => void
}

type ButtonProps = {
  item: Item
  active: boolean
  onSelect: (id: Viewport) => void
  buttonRef: (el: HTMLButtonElement | null) => void
}

const ViewportButton: React.FC<ButtonProps> = ({ item, active, onSelect, buttonRef }) => {
  const { id, label, Icon } = item
  return (
    <button
      type="button"
      ref={buttonRef}
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      className={active ? `${BTN_CLASS} ${BTN_CLASS}--active` : BTN_CLASS}
      onClick={() => onSelect(id)}
      title={label}
      aria-label={label}
    >
      <Icon />
    </button>
  )
}

export const ViewportToggle: React.FC<ViewportToggleProps> = ({ value, onChange }) => {
  const t = useBetterEditorT()
  const ITEMS = useMemo<ReadonlyArray<Item>>(
    () => [
      { id: 'desktop', label: t.viewport.desktop, Icon: DesktopIcon },
      { id: 'tablet', label: t.viewport.tablet, Icon: TabletIcon },
      { id: 'mobile', label: t.viewport.mobile, Icon: MobileIcon },
      { id: 'responsive', label: t.viewport.responsive, Icon: ResponsiveIcon },
    ],
    [t],
  )
  const btnsRef = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
      const isNext = e.key === 'ArrowRight' || e.key === 'ArrowDown'
      if (!isPrev && !isNext) return
      e.preventDefault()
      const idx = ITEMS.findIndex((i) => i.id === value)
      const start = idx === -1 ? 0 : idx
      const len = ITEMS.length
      // Per radiogroup pattern, arrow keys move both selection and focus.
      const nextIdx = isPrev ? (start - 1 + len) % len : (start + 1) % len
      const next = ITEMS[nextIdx]
      onChange(next.id)
      btnsRef.current[nextIdx]?.focus()
    },
    [onChange, value, ITEMS],
  )

  return (
    <div
      className={ROOT_CLASS}
      role="radiogroup"
      aria-label={t.viewport.groupLabel}
      onKeyDown={onKeyDown}
    >
      {ITEMS.map((item, i) => (
        <ViewportButton
          key={item.id}
          item={item}
          active={value === item.id}
          onSelect={onChange}
          buttonRef={(el) => {
            btnsRef.current[i] = el
          }}
        />
      ))}
    </div>
  )
}
