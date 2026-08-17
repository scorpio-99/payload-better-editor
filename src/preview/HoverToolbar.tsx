'use client'

import React from 'react'
import { ChevronDown, ChevronUp, CopyIcon, PlusIcon, TrashIcon } from '../admin/icons.js'
import type { BlockActionMessage } from './protocol.js'

type Action = BlockActionMessage['action']

export type HoverToolbarLabels = {
  moveUp: string
  moveDown: string
  duplicate: string
  addBelow: string
  delete: string
}

export type HoverToolbarProps = {
  onAction: (action: Action) => void
  labels: HoverToolbarLabels
}

export const HoverToolbar: React.FC<HoverToolbarProps> = ({ onAction, labels }) => {
  const buttons: ReadonlyArray<{ action: Action; Icon: React.ComponentType<{ size?: number }>; label: string }> = [
    { action: 'move-up', Icon: ChevronUp, label: labels.moveUp },
    { action: 'move-down', Icon: ChevronDown, label: labels.moveDown },
    { action: 'duplicate', Icon: CopyIcon, label: labels.duplicate },
    { action: 'add', Icon: PlusIcon, label: labels.addBelow },
    { action: 'delete', Icon: TrashIcon, label: labels.delete },
  ]

  return (
    <>
      {buttons.map(({ action, Icon, label }) => (
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
}
