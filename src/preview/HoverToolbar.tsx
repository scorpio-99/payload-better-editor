'use client'

import React from 'react'
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react'
import type { BlockActionMessage } from './protocol'

type Action = BlockActionMessage['action']

const BUTTONS: ReadonlyArray<{
  action: Action
  Icon: React.ComponentType<{ size?: number }>
  label: string
}> = [
  { action: 'move-up', Icon: ChevronUp, label: 'Move up' },
  { action: 'move-down', Icon: ChevronDown, label: 'Move down' },
  { action: 'duplicate', Icon: Copy, label: 'Duplicate' },
  { action: 'add', Icon: Plus, label: 'Add block below' },
  { action: 'delete', Icon: Trash2, label: 'Delete' },
]

export type HoverToolbarProps = {
  onAction: (action: Action) => void
}

export const HoverToolbar: React.FC<HoverToolbarProps> = ({ onAction }) => (
  <>
    {BUTTONS.map(({ action, Icon, label }) => (
      <button
        key={action}
        type="button"
        aria-label={label}
        title={label}
        data-action={action}
        onClick={(e) => {
          e.stopPropagation()
          onAction(action)
        }}
      >
        <Icon size={14} />
      </button>
    ))}
  </>
)
