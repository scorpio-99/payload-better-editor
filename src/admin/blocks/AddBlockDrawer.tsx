'use client'

import React from 'react'
import { BlocksDrawer } from '@payloadcms/ui'
import type { ClientBlock } from 'payload'
import { useBetterEditorT } from '../../i18n/useBetterEditorT'

export type AddBlockDrawerProps = {
  slug: string
  blocks: ClientBlock[]
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
}

export const AddBlockDrawer: React.FC<AddBlockDrawerProps> = ({
  slug,
  blocks,
  addRow,
  addRowIndex,
}) => {
  const t = useBetterEditorT()
  return (
    <BlocksDrawer
      addRow={addRow}
      addRowIndex={addRowIndex}
      blocks={blocks}
      drawerSlug={slug}
      labels={{ singular: t.blocks.drawerSingular, plural: t.blocks.drawerPlural }}
    />
  )
}
