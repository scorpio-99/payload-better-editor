'use client'

import React from 'react'
import {
  DesktopIcon,
  FullscreenIcon,
  MobileIcon,
  ResponsiveIcon,
  TabletIcon,
} from '../icons'

export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'responsive' | 'fullscreen'

type Item = { id: Viewport; label: string; Icon: React.FC }

const ITEMS: ReadonlyArray<Item> = [
  { id: 'desktop', label: 'Desktop', Icon: DesktopIcon },
  { id: 'tablet', label: 'Tablet', Icon: TabletIcon },
  { id: 'mobile', label: 'Mobile', Icon: MobileIcon },
  { id: 'responsive', label: 'Responsive (drag to resize)', Icon: ResponsiveIcon },
  { id: 'fullscreen', label: 'Fullscreen (hide sidebar)', Icon: FullscreenIcon },
]

export type ViewportToggleProps = {
  value: Viewport
  onChange: (next: Viewport) => void
}

type ButtonProps = {
  item: Item
  active: boolean
  onSelect: (id: Viewport) => void
}

const ViewportButton: React.FC<ButtonProps> = ({ item, active, onSelect }) => {
  const { id, label, Icon } = item
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={
        active
          ? 'better-editor-viewport__btn better-editor-viewport__btn--active'
          : 'better-editor-viewport__btn'
      }
      onClick={() => onSelect(id)}
      title={label}
      aria-label={label}
    >
      <Icon />
    </button>
  )
}

export const ViewportToggle: React.FC<ViewportToggleProps> = ({ value, onChange }) => (
  <div className="better-editor-viewport" role="radiogroup" aria-label="Preview viewport">
    {ITEMS.map((item) => (
      <ViewportButton
        key={item.id}
        item={item}
        active={value === item.id}
        onSelect={onChange}
      />
    ))}
  </div>
)
