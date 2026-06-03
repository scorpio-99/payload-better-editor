'use client'

/*
 * Icons vendored from lucide-react (https://lucide.dev) v0.577.0, inlined so the
 * plugin needs no icon-library dependency (see issue #11).
 *
 * ISC License — Copyright (c) Lucide Contributors; portions (c) Cole Bemis
 * 2013-2026 (Feather, MIT). Permission to use, copy, modify, and/or distribute
 * this software for any purpose with or without fee is hereby granted, provided
 * that the above copyright notice and this permission notice appear in all
 * copies. Full text: https://lucide.dev/license
 */

import React from 'react'

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string }

type IconNode = ReadonlyArray<readonly [tag: string, attrs: Record<string, string | number>]>

// Renders a lucide icon node inside lucide's default 24x24 stroke wrapper.
const createIcon = (node: IconNode): React.FC<IconProps> => {
  const Icon: React.FC<IconProps> = ({ size = 16, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {node.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  )
  return Icon
}

export const ChevronUp = createIcon([["path",{"d":"m18 15-6-6-6 6"}]])
export const ChevronDown = createIcon([["path",{"d":"m6 9 6 6 6-6"}]])
export const CopyIcon = createIcon([["rect",{"width":"14","height":"14","x":"8","y":"8","rx":"2","ry":"2"}],["path",{"d":"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"}]])
export const TrashIcon = createIcon([["path",{"d":"M10 11v6"}],["path",{"d":"M14 11v6"}],["path",{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}],["path",{"d":"M3 6h18"}],["path",{"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]])
export const PlusIcon = createIcon([["path",{"d":"M5 12h14"}],["path",{"d":"M12 5v14"}]])
export const DesktopIcon = createIcon([["rect",{"width":"20","height":"14","x":"2","y":"3","rx":"2"}],["line",{"x1":"8","x2":"16","y1":"21","y2":"21"}],["line",{"x1":"12","x2":"12","y1":"17","y2":"21"}]])
export const TabletIcon = createIcon([["rect",{"width":"16","height":"20","x":"4","y":"2","rx":"2","ry":"2"}],["line",{"x1":"12","x2":"12.01","y1":"18","y2":"18"}]])
export const MobileIcon = createIcon([["rect",{"width":"14","height":"20","x":"5","y":"2","rx":"2","ry":"2"}],["path",{"d":"M12 18h.01"}]])
export const ResponsiveIcon = createIcon([["path",{"d":"m18 8 4 4-4 4"}],["path",{"d":"M2 12h20"}],["path",{"d":"m6 8-4 4 4 4"}]])
export const FullscreenIcon = createIcon([["path",{"d":"m15 15 6 6"}],["path",{"d":"m15 9 6-6"}],["path",{"d":"M21 16v5h-5"}],["path",{"d":"M21 8V3h-5"}],["path",{"d":"M3 16v5h5"}],["path",{"d":"m3 21 6-6"}],["path",{"d":"M3 8V3h5"}],["path",{"d":"M9 9 3 3"}]])
export const FullscreenExitIcon = createIcon([["path",{"d":"m15 15 6 6m-6-6v4.8m0-4.8h4.8"}],["path",{"d":"M9 19.8V15m0 0H4.2M9 15l-6 6"}],["path",{"d":"M15 4.2V9m0 0h4.8M15 9l6-6"}],["path",{"d":"M9 4.2V9m0 0H4.2M9 9 3 3"}]])
export const UndoIcon = createIcon([["path",{"d":"M3 7v6h6"}],["path",{"d":"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"}]])
export const RedoIcon = createIcon([["path",{"d":"M21 7v6h-6"}],["path",{"d":"M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"}]])
export const LayoutIcon = createIcon([["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M9 3v18"}]])
export const SidebarHideIcon = createIcon([["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M15 3v18"}],["path",{"d":"m8 9 3 3-3 3"}]])
export const SidebarShowIcon = createIcon([["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M15 3v18"}],["path",{"d":"m10 15-3-3 3-3"}]])
export const InteractIcon = createIcon([["path",{"d":"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"}]])
export const InteractOffIcon = createIcon([["path",{"d":"m15.55 8.45 5.138 2.087a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063L8.45 15.551"}],["path",{"d":"M22 2 2 22"}],["path",{"d":"m6.816 11.528-2.779-6.84a.495.495 0 0 1 .651-.651l6.84 2.779"}]])
export const StarIcon = createIcon([["path",{"d":"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"}]])
export const BugIcon = createIcon([["path",{"d":"M12 20v-9"}],["path",{"d":"M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"}],["path",{"d":"M14.12 3.88 16 2"}],["path",{"d":"M21 21a4 4 0 0 0-3.81-4"}],["path",{"d":"M21 5a4 4 0 0 1-3.55 3.97"}],["path",{"d":"M22 13h-4"}],["path",{"d":"M3 21a4 4 0 0 1 3.81-4"}],["path",{"d":"M3 5a4 4 0 0 0 3.55 3.97"}],["path",{"d":"M6 13H2"}],["path",{"d":"m8 2 1.88 1.88"}],["path",{"d":"M9 7.13V6a3 3 0 1 1 6 0v1.13"}]])
export const GithubIcon = createIcon([["path",{"d":"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"}],["path",{"d":"M9 18c-4.51 2-5-2-7-2"}]])
