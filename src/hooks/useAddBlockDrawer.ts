'use client'

import { useEffect, useRef } from 'react'
import { useModal } from '@payloadcms/ui'

export type UseAddBlockDrawerArgs = {
  drawerSlug: string
  /** Bumped externally to request the drawer to open. */
  requestId: number
  /** Drawer should only open when a block is currently selected. */
  selectedBlockPath: string | null
}

/**
 * Defers `toggleModal(drawerSlug)` to the next paint so the drawer is
 * mounted before we open it (the sidebar may have just auto-switched to
 * the Blocks tab). De-duplicates by `requestId` so a stale id can't
 * re-trigger after the drawer has been closed.
 */
export const useAddBlockDrawer = ({
  drawerSlug,
  requestId,
  selectedBlockPath,
}: UseAddBlockDrawerArgs): void => {
  const { toggleModal } = useModal()
  const lastHandledRef = useRef(0)

  useEffect(() => {
    if (!requestId || requestId === lastHandledRef.current) return
    if (!selectedBlockPath) return
    lastHandledRef.current = requestId
    const raf = requestAnimationFrame(() => toggleModal(drawerSlug))
    return () => cancelAnimationFrame(raf)
  }, [requestId, selectedBlockPath, toggleModal, drawerSlug])
}
