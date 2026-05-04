import type { ParentInboundMessage } from '../preview/protocol'
import { isParentInboundMessage } from '../preview/protocol'

// Same-origin only: parent and iframe live under one Payload host. Any
// message from a different origin is dropped before reaching `handler`.
export const postToParent = (message: ParentInboundMessage): void => {
  window.parent.postMessage(message, window.location.origin)
}

export const listenForParentInbound = (
  handler: (msg: ParentInboundMessage) => void,
): (() => void) => {
  const onMessage = (e: MessageEvent) => {
    if (e.source !== window.parent) return
    if (e.origin !== window.location.origin) return
    if (!isParentInboundMessage(e.data)) return
    handler(e.data)
  }
  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}
