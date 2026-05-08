/**
 * Reads `iframe.contentDocument` defensively. Throws cross-origin —
 * returning `null` lets callers bail out without try/catch boilerplate.
 */
export const getSameOriginDocument = (iframe: HTMLIFrameElement): Document | null => {
  try {
    return iframe.contentDocument
  } catch {
    return null
  }
}
