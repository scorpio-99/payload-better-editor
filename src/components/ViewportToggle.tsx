'use client'

import React from 'react'

export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'responsive' | 'fullscreen'

const DesktopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)
const TabletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)
const MobileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)
const ResponsiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 3 12 9 6" />
    <polyline points="15 6 21 12 15 18" />
  </svg>
)
const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="4 9 4 4 9 4" />
    <polyline points="20 9 20 4 15 4" />
    <polyline points="20 15 20 20 15 20" />
    <polyline points="4 15 4 20 9 20" />
  </svg>
)

const ITEMS: { id: Viewport; label: string; Icon: React.FC }[] = [
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

export const ViewportToggle: React.FC<ViewportToggleProps> = ({ value, onChange }) => {
  return (
    <div className="better-editor-viewport" role="radiogroup" aria-label="Preview viewport">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          className={
            'better-editor-viewport__btn' +
            (value === id ? ' better-editor-viewport__btn--active' : '')
          }
          onClick={() => onChange(id)}
          title={label}
          aria-label={label}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}
