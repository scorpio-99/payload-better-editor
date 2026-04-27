'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAllFormFields, useLivePreviewContext } from '@payloadcms/ui'
import { PreviewFrame } from './components/PreviewFrame'
import { Sidebar } from './components/Sidebar'
import {
  BetterEditorSettingsProvider,
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  useBetterEditorSettings,
} from './useBetterEditorSettings'
import './styles.css'

export type LiveEditorOverlayProps = {
  onClose: () => void
  blocksField: string
  topLevelBlocksSelector: string
}

/**
 * Walk the flat form-state map and find the block whose `id` field equals
 * `targetId`. Returns the path prefix (e.g. `layout.2.columns.0.blocks.1`)
 * or null if no row owns this id. Works for arbitrarily nested blocks
 * because Payload stores every block row's auto-generated id at
 * `<path>.id` regardless of depth.
 */
function findPathById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>,
  targetId: string,
): string | null {
  for (const key in fields) {
    if (!key.endsWith('.id')) continue
    if (fields[key]?.value === targetId) {
      return key.slice(0, -'.id'.length)
    }
  }
  return null
}

export const LiveEditorOverlay: React.FC<LiveEditorOverlayProps> = (props) => {
  return (
    <BetterEditorSettingsProvider>
      <LiveEditorOverlayInner {...props} />
    </BetterEditorSettingsProvider>
  )
}

const LiveEditorOverlayInner: React.FC<LiveEditorOverlayProps> = ({
  onClose,
  blocksField,
  topLevelBlocksSelector,
}) => {
  const settings = useBetterEditorSettings()
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const { previewURL, isPreviewEnabled } = useLivePreviewContext()

  // Drag-to-resize: handle measures the body width on mousedown so we can
  // translate cursor moves into a sidebar width regardless of sidebar
  // position (left/right swap just inverts the delta direction).
  const onResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth
      const direction = settings.sidebarPosition === 'right' ? -1 : 1

      setIsResizing(true)

      const onMove = (ev: MouseEvent) => {
        const delta = (ev.clientX - startX) * direction
        const next = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta),
        )
        setSidebarWidth(next)
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsResizing(false)
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [sidebarWidth, settings.sidebarPosition],
  )

  // Subscribe to the document's form state so we can resolve a clicked
  // block's id back to its form-state path. Kept in a ref so the
  // postMessage listener doesn't have to re-bind on every form change.
  const [allFields] = useAllFormFields()
  const allFieldsRef = useRef(allFields)
  useEffect(() => {
    allFieldsRef.current = allFields
  }, [allFields])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    // The iframe's click handler (in PreviewFrame) posts focus-block messages
    // back to this window. New shape carries `id`; legacy shape carries
    // `field` + `index`.
    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return
      if (data.type !== 'focus-block') return

      if (typeof data.id === 'string') {
        const path = findPathById(allFieldsRef.current, data.id)
        if (path) setSelectedBlockPath(path)
        return
      }

      if (typeof data.field === 'string' && typeof data.index === 'number') {
        setSelectedBlockPath(`${data.field}.${data.index}`)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const isLeft = settings.sidebarPosition === 'left'
  const gridCols = isLeft ? `${sidebarWidth}px 6px 1fr` : `1fr 6px ${sidebarWidth}px`
  const previewOrder = isLeft ? 2 : 0
  const handleOrder = 1
  const sidebarOrder = isLeft ? 0 : 2

  return (
    <div
      className={'better-editor' + (isResizing ? ' better-editor--resizing' : '')}
      role="dialog"
      aria-label="Better Editor"
    >
      <div
        ref={bodyRef}
        className="better-editor__body"
        style={{ gridTemplateColumns: gridCols } as React.CSSProperties}
      >
        <div className="better-editor__preview" style={{ order: previewOrder }}>
          <PreviewFrame
            previewURL={previewURL}
            isPreviewEnabled={isPreviewEnabled}
            blocksField={blocksField}
            topLevelBlocksSelector={topLevelBlocksSelector}
            hoverColorTopLevel={settings.hoverColorTopLevel}
            hoverColorNested={settings.hoverColorNested}
            hoverOutlineWidth={settings.hoverOutlineWidth}
          />
        </div>
        <div
          className="better-editor__resize-handle"
          style={{ order: handleOrder }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={onResizeStart}
        />
        <aside className="better-editor__sidebar" style={{ order: sidebarOrder }}>
          <Sidebar
            selectedBlockPath={selectedBlockPath}
            onClearSelection={() => setSelectedBlockPath(null)}
            forceFullWidthFields={settings.forceFullWidthFields}
          />
        </aside>
      </div>
    </div>
  )
}
