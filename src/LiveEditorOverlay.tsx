'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAllFormFields, useForm, useLivePreviewContext } from '@payloadcms/ui'
import { OverlayErrorBoundary } from './components/ErrorBoundary'
import { PreviewFrame } from './components/PreviewFrame'
import { Sidebar } from './components/Sidebar'
import { ViewportToggle, type Viewport } from './components/ViewportToggle'
import {
  BetterEditorSettingsProvider,
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  useBetterEditorSettings,
} from './useBetterEditorSettings'
import { EditorHistoryProvider, useEditorHistory } from './useEditorHistory'
import { RedoIcon, UndoIcon } from './icons'
import './styles.css'

export type LiveEditorOverlayProps = {
  onClose: () => void
  blocksField: string
}

const SIDEBAR_WIDTH_KEY = 'better-editor:sidebar-width'
const RESPONSIVE_WIDTH_KEY = 'better-editor:responsive-width'
const DEFAULT_RESPONSIVE_WIDTH = 1024

function readPersistedWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_KEY)
    const parsed = raw == null ? NaN : Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_SIDEBAR_WIDTH
    return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed))
  } catch {
    return DEFAULT_SIDEBAR_WIDTH
  }
}

function readPersistedResponsiveWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_RESPONSIVE_WIDTH
  try {
    const raw = window.localStorage.getItem(RESPONSIVE_WIDTH_KEY)
    const parsed = raw == null ? NaN : Number(raw)
    if (!Number.isFinite(parsed)) return DEFAULT_RESPONSIVE_WIDTH
    return Math.min(2400, Math.max(240, parsed))
  } catch {
    return DEFAULT_RESPONSIVE_WIDTH
  }
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
    <OverlayErrorBoundary onClose={props.onClose}>
      <BetterEditorSettingsProvider>
        <EditorHistoryProvider>
          <LiveEditorOverlayInner {...props} />
        </EditorHistoryProvider>
      </BetterEditorSettingsProvider>
    </OverlayErrorBoundary>
  )
}

const LiveEditorOverlayInner: React.FC<LiveEditorOverlayProps> = ({
  onClose,
  blocksField,
}) => {
  const settings = useBetterEditorSettings()
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => readPersistedWidth())
  const [isResizing, setIsResizing] = useState(false)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [responsiveWidth, setResponsiveWidth] = useState<number>(() => readPersistedResponsiveWidth())
  const [iframeWidth, setIframeWidth] = useState<number | null>(null)
  // Bumped when the iframe hover toolbar fires "add". BlockSettingsTab
  // observes this and opens the BlocksDrawer scoped to the parent's
  // allowed blocks. Using a request-id (timestamp) lets repeated clicks
  // reopen the drawer even if the selected block didn't change.
  const [addBelowRequestId, setAddBelowRequestId] = useState<number>(0)

  // Persist the responsive-mode width across opens (separate from sidebar).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(RESPONSIVE_WIDTH_KEY, String(responsiveWidth))
    } catch {
      // ignore
    }
  }, [responsiveWidth])

  // Resolve the active viewport width from settings + responsive state.
  // Fullscreen + Desktop both render at full available preview width.
  const viewportWidth =
    viewport === 'desktop' || viewport === 'fullscreen'
      ? null
      : viewport === 'tablet'
        ? settings.tabletWidth
        : viewport === 'mobile'
          ? settings.mobileWidth
          : responsiveWidth

  const overlayRef = useRef<HTMLDivElement | null>(null)
  const isFullscreen = viewport === 'fullscreen'

  // Toggle the browser's Fullscreen API on the overlay root when entering /
  // leaving fullscreen viewport. If the user exits via Esc / browser UI,
  // the fullscreenchange listener resets viewport so the sidebar comes back.
  useEffect(() => {
    const root = overlayRef.current
    if (!root) return
    if (isFullscreen && !document.fullscreenElement) {
      root.requestFullscreen?.().catch(() => {
        // Some browsers block requestFullscreen outside user gesture; fail quiet.
      })
    } else if (!isFullscreen && document.fullscreenElement === root) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [isFullscreen])

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setViewport('desktop')
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [isFullscreen])
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const { previewURL, isPreviewEnabled } = useLivePreviewContext()

  // Persist drag-resized width across editor opens / page reloads.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
    } catch {
      // storage unavailable / quota — silently fall back to in-memory
    }
  }, [sidebarWidth])

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

  // Same form context the BlockSettingsTab uses — needed so iframe-toolbar
  // actions (block-action messages) can dispatch the same row mutations.
  const { dispatchFields, setModified } = useForm()
  const history = useEditorHistory()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) {
          history.redo()
        } else {
          history.undo()
        }
      } else if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        history.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, history])

  useEffect(() => {
    // The iframe's click handler (in PreviewFrame) posts focus-block messages
    // back to this window. New shape carries `id`; legacy shape carries
    // `field` + `index`. The hover toolbar posts `block-action` messages.
    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return

      if (data.type === 'focus-block') {
        if (typeof data.id === 'string') {
          const path = findPathById(allFieldsRef.current, data.id)
          if (path) setSelectedBlockPath(path)
        }
        return
      }

      if (data.type === 'block-action' && typeof data.id === 'string') {
        const path = findPathById(allFieldsRef.current, data.id)
        if (!path) return
        const lastDot = path.lastIndexOf('.')
        if (lastDot < 0) return
        const parentPath = path.slice(0, lastDot)
        const rowIndex = Number(path.slice(lastDot + 1))
        if (Number.isNaN(rowIndex)) return
        const rows = allFieldsRef.current[parentPath]?.rows
        const rowCount = Array.isArray(rows) ? rows.length : 0

        // "add" is handled separately — no mutation here. We just select
        // the clicked block and ping BlockSettingsTab to open its
        // BlocksDrawer; the actual ADD_ROW dispatch (and snapshot) lives
        // in addRowAfterSelected when the drawer's user picks a block.
        if (data.action === 'add') {
          setSelectedBlockPath(path)
          setAddBelowRequestId(Date.now())
          return
        }

        history.pushSnapshot()
        switch (data.action) {
          case 'move-up':
            if (rowIndex <= 0) return
            dispatchFields({
              type: 'MOVE_ROW',
              path: parentPath,
              moveFromIndex: rowIndex,
              moveToIndex: rowIndex - 1,
            })
            setSelectedBlockPath(`${parentPath}.${rowIndex - 1}`)
            break
          case 'move-down':
            if (rowIndex >= rowCount - 1) return
            dispatchFields({
              type: 'MOVE_ROW',
              path: parentPath,
              moveFromIndex: rowIndex,
              moveToIndex: rowIndex + 1,
            })
            setSelectedBlockPath(`${parentPath}.${rowIndex + 1}`)
            break
          case 'duplicate':
            dispatchFields({ type: 'DUPLICATE_ROW', path: parentPath, rowIndex })
            setSelectedBlockPath(`${parentPath}.${rowIndex + 1}`)
            break
          case 'delete':
            dispatchFields({ type: 'REMOVE_ROW', path: parentPath, rowIndex })
            setSelectedBlockPath(null)
            break
          default:
            return
        }
        setModified(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatchFields, setModified, history])

  const isLeft = settings.sidebarPosition === 'left'
  const gridCols = isFullscreen
    ? '1fr'
    : isLeft
      ? `${sidebarWidth}px 6px 1fr`
      : `1fr 6px ${sidebarWidth}px`
  const previewOrder = isLeft ? 2 : 0
  const handleOrder = 1
  const sidebarOrder = isLeft ? 0 : 2

  return (
    <div
      ref={overlayRef}
      className={
        'better-editor' +
        (isResizing ? ' better-editor--resizing' : '') +
        (isFullscreen ? ' better-editor--fullscreen' : '')
      }
      role="dialog"
      aria-label="Better Editor"
    >
      <div
        ref={bodyRef}
        className="better-editor__body"
        style={{ gridTemplateColumns: gridCols } as React.CSSProperties}
      >
        <div className="better-editor__preview" style={{ order: previewOrder }}>
          <div className="better-editor__preview-toolbar">
            <div className="better-editor__history">
              <button
                type="button"
                className="better-editor__history-btn"
                onClick={history.undo}
                disabled={!history.canUndo}
                title="Undo (Cmd/Ctrl+Z)"
                aria-label="Undo"
              >
                <UndoIcon />
              </button>
              <button
                type="button"
                className="better-editor__history-btn"
                onClick={history.redo}
                disabled={!history.canRedo}
                title="Redo (Cmd/Ctrl+Shift+Z)"
                aria-label="Redo"
              >
                <RedoIcon />
              </button>
            </div>
            <div className="better-editor__preview-toolbar-right">
              {iframeWidth ? (
                <span className="better-editor__width-chip" aria-live="polite">
                  {iframeWidth}
                  <span className="better-editor__width-chip-unit">px</span>
                </span>
              ) : null}
              <ViewportToggle value={viewport} onChange={setViewport} />
            </div>
          </div>
          <div className="better-editor__preview-stage">
            <PreviewFrame
              previewURL={previewURL}
              isPreviewEnabled={isPreviewEnabled}
              hoverColorTopLevel={settings.hoverColorTopLevel}
              hoverColorNested={settings.hoverColorNested}
              hoverOutlineWidth={settings.hoverOutlineWidth}
              showHoverToolbar={settings.showHoverToolbar}
              hoverToolbarPosition={settings.hoverToolbarPosition}
              viewportWidth={viewportWidth}
              resizable={viewport === 'responsive'}
              onResize={setResponsiveWidth}
              onIframeWidthChange={setIframeWidth}
            />
          </div>
        </div>
        {!isFullscreen ? (
          <>
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
                onSelectPath={setSelectedBlockPath}
                forceFullWidthFields={settings.forceFullWidthFields}
                blocksField={blocksField}
                addBelowRequestId={addBelowRequestId}
              />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  )
}
