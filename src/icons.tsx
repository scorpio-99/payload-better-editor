'use client'

import React from 'react'
import {
  ChevronUp as L_ChevronUp,
  ChevronDown as L_ChevronDown,
  Copy as L_Copy,
  Trash2 as L_Trash2,
  Plus as L_Plus,
  Monitor as L_Monitor,
  Tablet as L_Tablet,
  Smartphone as L_Smartphone,
  MoveHorizontal as L_MoveHorizontal,
  Maximize2 as L_Maximize2,
  Undo2 as L_Undo2,
  Redo2 as L_Redo2,
  PanelLeft as L_PanelLeft,
  type LucideProps,
} from 'lucide-react'

/**
 * Re-exports from `lucide-react` with our default size pinned to 16px
 * (lucide-react's own default is 24). Caller-supplied props win, so any
 * usage site can still override `size`, `strokeWidth`, etc.
 */
const sized = (Icon: React.ComponentType<LucideProps>): React.FC<LucideProps> => {
  const Wrapped: React.FC<LucideProps> = (props) => <Icon size={16} {...props} />
  Wrapped.displayName = `Sized(${Icon.displayName ?? Icon.name})`
  return Wrapped
}

export const ChevronUp = sized(L_ChevronUp)
export const ChevronDown = sized(L_ChevronDown)
export const CopyIcon = sized(L_Copy)
export const TrashIcon = sized(L_Trash2)
export const PlusIcon = sized(L_Plus)
export const DesktopIcon = sized(L_Monitor)
export const TabletIcon = sized(L_Tablet)
export const MobileIcon = sized(L_Smartphone)
export const ResponsiveIcon = sized(L_MoveHorizontal)
export const FullscreenIcon = sized(L_Maximize2)
export const UndoIcon = sized(L_Undo2)
export const RedoIcon = sized(L_Redo2)
export const LayoutIcon = sized(L_PanelLeft)
