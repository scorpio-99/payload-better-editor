export type FocusBlockMessage = { type: 'focus-block'; id: string }
export type BlockActionMessage = {
  type: 'block-action'
  id: string
  action: 'move-up' | 'move-down' | 'duplicate' | 'add' | 'delete'
}
export type ParentInboundMessage = FocusBlockMessage | BlockActionMessage

const BLOCK_ACTIONS: ReadonlySet<string> = new Set<BlockActionMessage['action']>([
  'move-up',
  'move-down',
  'duplicate',
  'add',
  'delete',
])

export const isParentInboundMessage = (data: unknown): data is ParentInboundMessage => {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.id !== 'string') return false
  if (d.type === 'focus-block') return true
  if (d.type === 'block-action') {
    return typeof d.action === 'string' && BLOCK_ACTIONS.has(d.action)
  }
  return false
}
