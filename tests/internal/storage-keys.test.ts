import { describe, expect, it } from 'vitest'
import { buildStorageKeys, DEFAULT_STORAGE_KEYS, DEFAULT_STORAGE_NAMESPACE } from '../../src/internal/storage-keys'

describe('buildStorageKeys', () => {
  it('uses the default namespace when none is provided', () => {
    const k = buildStorageKeys()
    expect(k.sidebarWidth).toBe(`${DEFAULT_STORAGE_NAMESPACE}:sidebar-width`)
    expect(k.responsiveWidth).toBe(`${DEFAULT_STORAGE_NAMESPACE}:responsive-width`)
  })

  it('prefixes with the supplied namespace', () => {
    const k = buildStorageKeys('tenant-a')
    expect(k.sidebarWidth).toBe('tenant-a:sidebar-width')
    expect(k.responsiveWidth).toBe('tenant-a:responsive-width')
  })

  it('builds togglePreference keys for collections', () => {
    const k = buildStorageKeys('be')
    expect(k.togglePreference('pages')).toBe('be:collection-pages')
  })

  it('builds togglePreference keys for globals', () => {
    const k = buildStorageKeys('be')
    expect(k.togglePreference(undefined, 'header')).toBe('be:global-header')
  })

  it('falls back to "unknown" when neither slug is provided', () => {
    const k = buildStorageKeys('be')
    expect(k.togglePreference()).toBe('be:global-unknown')
  })

  it('exposes a default-keys instance for callers without a custom namespace', () => {
    expect(DEFAULT_STORAGE_KEYS.sidebarWidth).toBe(`${DEFAULT_STORAGE_NAMESPACE}:sidebar-width`)
  })
})
