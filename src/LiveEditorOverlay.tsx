'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAllFormFields, useLivePreviewContext } from '@payloadcms/ui'
import { PreviewFrame } from './components/PreviewFrame'
import { Sidebar } from './components/Sidebar'
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

export const LiveEditorOverlay: React.FC<LiveEditorOverlayProps> = ({
  onClose,
  blocksField,
  topLevelBlocksSelector,
}) => {
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const { previewURL, isPreviewEnabled } = useLivePreviewContext()

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

  return (
    <div className="better-editor" role="dialog" aria-label="Better Editor">
      <div className="better-editor__body">
        <div className="better-editor__preview">
          <PreviewFrame
            previewURL={previewURL}
            isPreviewEnabled={isPreviewEnabled}
            blocksField={blocksField}
            topLevelBlocksSelector={topLevelBlocksSelector}
          />
        </div>
        <aside className="better-editor__sidebar">
          <Sidebar
            selectedBlockPath={selectedBlockPath}
            onClearSelection={() => setSelectedBlockPath(null)}
          />
        </aside>
      </div>
    </div>
  )
}
