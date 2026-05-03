'use client'

import React from 'react'
import { BlocksDrawer } from '@payloadcms/ui'
import type { AnyClientBlock } from '../../internal/types'

export type AddBlockDrawerProps = {
  slug: string
  blocks: AnyClientBlock[]
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
}

/** `BlocksDrawer` wrapper that fixes our default labels. */
export const AddBlockDrawer: React.FC<AddBlockDrawerProps> = ({
  slug,
  blocks,
  addRow,
  addRowIndex,
}) => (
  <BlocksDrawer
    addRow={addRow}
    addRowIndex={addRowIndex}
    blocks={blocks}
    drawerSlug={slug}
    labels={{ singular: 'Block', plural: 'Blocks' }}
  />
)
