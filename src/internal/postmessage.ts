import type { ParentInboundMessage } from '../preview/protocol.js'
import { isParentInboundMessage } from '../preview/protocol.js'

// Same-origin only: parent and iframe live under one Payload host. Any
// message from a different origin is dropped before reaching `handler`.
export const postToParent = (message: ParentInboundMessage): void => {
  window.parent.postMessage(message, window.location.origin)
}

// Click + hover handlers are installed on the iframe document but their
// closures run in the parent JS context, so postToParent is effectively a
// same-window self-post (window.parent === window when the admin is
// top-level). The origin + shape checks below are the actual gate.
export const listenForParentInbound = (
  handler: (msg: ParentInboundMessage) => void,
): (() => void) => {
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return
    if (!isParentInboundMessage(e.data)) return
    handler(e.data)
  }
  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}
