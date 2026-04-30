'use client'

import React from 'react'
import { BlocksDrawer } from '@payloadcms/ui'
import type { AnyField } from './schema'

export type AddBlockDrawerProps = {
  slug: string
  blocks: AnyField[]
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
}

/** `BlocksDrawer` wrapper with our default labels + the `blocks` cast. */
export const AddBlockDrawer: React.FC<AddBlockDrawerProps> = ({
  slug,
  blocks,
  addRow,
  addRowIndex,
}) => (
  <BlocksDrawer
    addRow={addRow}
    addRowIndex={addRowIndex}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocks={blocks as any}
    drawerSlug={slug}
    labels={{ singular: 'Block', plural: 'Blocks' }}
  />
)
