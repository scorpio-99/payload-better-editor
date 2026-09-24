import type { GlobalConfig } from 'payload'
import { betterEditorSettingsGlobal } from '../global.js'

/**
 * Lists the access operations on the settings global that still use the
 * plugin's permissive defaults: `read` is public while it is the plugin's own
 * function, and `update` falls back to Payload's "any logged-in user" when
 * unset. An unset `read` also falls back to "logged-in", so it isn't flagged.
 * An explicitly configured function — even an allow-all one — counts as a
 * deliberate choice.
 */
export const findPermissiveSettingsAccess = (global: GlobalConfig): Array<'read' | 'update'> => {
  const permissive: Array<'read' | 'update'> = []
  if (global.access?.read === betterEditorSettingsGlobal.access?.read) permissive.push('read')
  if (!global.access?.update) permissive.push('update')
  return permissive
}
