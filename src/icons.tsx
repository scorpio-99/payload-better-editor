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
  Expand as L_Expand,
  Undo as L_Undo,
  Redo as L_Redo,
  PanelLeft as L_PanelLeft,
  PanelRightOpen as L_PanelRightOpen,
  PanelRightClose as L_PanelRightClose,
  type LucideProps,
} from 'lucide-react'

// Pin default size to 16px (lucide's own default is 24); caller props win.
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
export const FullscreenIcon = sized(L_Expand)
export const UndoIcon = sized(L_Undo)
export const RedoIcon = sized(L_Redo)
export const LayoutIcon = sized(L_PanelLeft)
export const SidebarHideIcon = sized(L_PanelRightClose)
export const SidebarShowIcon = sized(L_PanelRightOpen)
