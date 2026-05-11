/**
 * Reads `iframe.contentDocument` defensively. Throws cross-origin —
 * returning `null` lets callers bail out without try/catch boilerplate.
 *
 * Firefox can hand back a Document whose `location` is `null` during the
 * transient pre-navigation phase of a freshly mounted iframe. Treat that
 * as "not ready" so callers don't trip a TypeError on `doc.location.href`.
 */
export const getSameOriginDocument = (iframe: HTMLIFrameElement): Document | null => {
  try {
    const doc = iframe.contentDocument
    if (!doc || !doc.location) return null
    return doc
  } catch {
    return null
  }
}
