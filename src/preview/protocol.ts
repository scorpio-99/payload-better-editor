export type FocusBlockMessage = { type: 'focus-block'; id: string }
export type BlockActionMessage = {
  type: 'block-action'
  id: string
  action: 'move-up' | 'move-down' | 'duplicate' | 'add' | 'delete'
}
export type ParentInboundMessage = FocusBlockMessage | BlockActionMessage

export const isParentInboundMessage = (data: unknown): data is ParentInboundMessage => {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (d.type !== 'focus-block' && d.type !== 'block-action') return false
  if (typeof d.id !== 'string') return false
  if (d.type === 'block-action') {
    if (typeof d.action !== 'string') return false
  }
  return true
}
