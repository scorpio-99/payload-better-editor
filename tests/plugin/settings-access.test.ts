import type { Config, GlobalConfig } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { betterEditor, BETTER_EDITOR_SETTINGS_SLUG, betterEditorSettingsGlobal } from '../../src/index'
import { findPermissiveSettingsAccess } from '../../src/internal/settings-access'

const settingsGlobal = (config: Config) =>
  config.globals?.find((g) => g.slug === BETTER_EDITOR_SETTINGS_SLUG) as GlobalConfig

afterEach(() => {
  vi.restoreAllMocks()
})

describe('findPermissiveSettingsAccess', () => {
  it('flags the plugin defaults', () => {
    expect(findPermissiveSettingsAccess(betterEditorSettingsGlobal)).toEqual(['read', 'update'])
  })

  it('accepts explicitly configured functions, even allow-all ones', () => {
    const global = { ...betterEditorSettingsGlobal, access: { read: () => true, update: () => true } }
    expect(findPermissiveSettingsAccess(global)).toEqual([])
  })

  it('does not flag an unset read, which Payload limits to logged-in users', () => {
    const global = { ...betterEditorSettingsGlobal, access: { update: () => false } }
    expect(findPermissiveSettingsAccess(global)).toEqual([])
  })

  it('flags only the operations left at their defaults', () => {
    const global = {
      ...betterEditorSettingsGlobal,
      access: { ...betterEditorSettingsGlobal.access, update: () => false },
    }
    expect(findPermissiveSettingsAccess(global)).toEqual(['read'])
  })
})

describe('settingsOverrides', () => {
  it('keeps the default global when unset', () => {
    const config = betterEditor({ collections: ['pages'] })({ collections: [] } as unknown as Config)
    expect(settingsGlobal(config).access).toBe(betterEditorSettingsGlobal.access)
  })

  it('registers the overridden global with its slug pinned', () => {
    const update = () => false
    const config = betterEditor({
      collections: ['pages'],
      settingsOverrides: ({ defaultGlobal }) => ({
        ...defaultGlobal,
        slug: 'renamed',
        access: { ...defaultGlobal.access, update },
      }),
    })({ collections: [] } as unknown as Config)
    expect(settingsGlobal(config).access?.update).toBe(update)
    expect(config.globals?.some((g) => g.slug === 'renamed')).toBe(false)
  })
})

describe('permissive access warning', () => {
  it('warns once per process and checks a host-registered settings global', async () => {
    vi.resetModules()
    const { betterEditor: fresh } = await import('../../src/index')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ownGlobal = { slug: BETTER_EDITOR_SETTINGS_SLUG, fields: [] } as GlobalConfig

    fresh({ collections: ['pages'] })({ collections: [], globals: [ownGlobal] } as unknown as Config)
    fresh({ collections: ['pages'] })({ collections: [], globals: [ownGlobal] } as unknown as Config)

    const accessWarnings = warn.mock.calls.filter(([msg]) => String(msg).includes('permissive'))
    expect(accessWarnings).toHaveLength(1)
    expect(accessWarnings[0][0]).toContain('any logged-in user can update it')
    expect(accessWarnings[0][0]).not.toContain('anyone can read it')
  })

  it('stays silent when both operations are configured', async () => {
    vi.resetModules()
    const { betterEditor: fresh } = await import('../../src/index')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    fresh({
      collections: ['pages'],
      settingsOverrides: ({ defaultGlobal }) => ({
        ...defaultGlobal,
        access: { read: () => true, update: () => true },
      }),
    })({ collections: [] } as unknown as Config)

    expect(warn.mock.calls.some(([msg]) => String(msg).includes('permissive'))).toBe(false)
  })
})
