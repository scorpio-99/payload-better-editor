'use client'

import React from 'react'
import { ChevronDown, ChevronUp, CopyIcon, PlusIcon, TrashIcon } from '../admin/icons'
import type { BlockActionMessage } from './protocol'

type Action = BlockActionMessage['action']

const BUTTONS: ReadonlyArray<{
  action: Action
  Icon: React.ComponentType<{ size?: number }>
  label: string
}> = [
  { action: 'move-up', Icon: ChevronUp, label: 'Move up' },
  { action: 'move-down', Icon: ChevronDown, label: 'Move down' },
  { action: 'duplicate', Icon: CopyIcon, label: 'Duplicate' },
  { action: 'add', Icon: PlusIcon, label: 'Add block below' },
  { action: 'delete', Icon: TrashIcon, label: 'Delete' },
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
