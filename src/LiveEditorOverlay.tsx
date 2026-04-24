'use client'

import React, { useEffect, useState } from 'react'
import { useLivePreviewContext } from '@payloadcms/ui'
import { PreviewFrame } from './components/PreviewFrame'
import { Sidebar } from './components/Sidebar'
import './styles.css'

export type LiveEditorOverlayProps = {
  onClose: () => void
  blocksField: string
  topLevelBlocksSelector: string
}

export const LiveEditorOverlay: React.FC<LiveEditorOverlayProps> = ({
  onClose,
  blocksField,
  topLevelBlocksSelector,
}) => {
  const [selectedBlockPath, setSelectedBlockPath] = useState<string | null>(null)
  const { previewURL, isPreviewEnabled } = useLivePreviewContext()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    // The iframe's click handler (in PreviewFrame) posts focus-block messages
    // back to this window.
    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return
      if (
        data.type === 'focus-block' &&
        typeof data.field === 'string' &&
        typeof data.index === 'number'
      ) {
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
