// @vitest-environment jsdom
// Guards #20: hover vars land in an injected <style>, never on <html>.

import { afterEach, describe, expect, it } from 'vitest'
import {
  HOVER_VARS_STYLE_ID,
  clearHoverVars,
  setHoverVars,
} from '../../src/preview/hover-css'

const VALID = { topColor: '#3b82f6', nestedColor: '#f59e0b', outlineWidth: 2 }

const varsEl = () => document.getElementById(HOVER_VARS_STYLE_ID)

afterEach(() => {
  clearHoverVars(document)
  document.documentElement.removeAttribute('style')
})

describe('setHoverVars', () => {
  it('never writes an inline style onto documentElement', () => {
    setHoverVars(document, VALID)
    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  it('injects a :root rule with the vars into a <style> in <head>', () => {
    setHoverVars(document, VALID)
    const el = varsEl()
    expect(el?.parentElement).toBe(document.head)
    const css = el?.textContent ?? ''
    expect(css).toContain(':root')
    expect(css).toContain('--bee-top: #3b82f6;')
    expect(css).toContain('--bee-nested: #f59e0b;')
    expect(css).toContain('--bee-outline-width: 2px;')
  })

  it('reuses the same element on repeated calls', () => {
    setHoverVars(document, VALID)
    const first = varsEl()
    setHoverVars(document, { ...VALID, topColor: '#000000' })
    expect(varsEl()).toBe(first)
    expect(document.querySelectorAll(`#${HOVER_VARS_STYLE_ID}`)).toHaveLength(1)
    expect(varsEl()?.textContent).toContain('--bee-top: #000000;')
  })

  it('skips invalid values instead of emitting them', () => {
    setHoverVars(document, { topColor: 'red; }', nestedColor: '#f59e0b', outlineWidth: 2 })
    const css = varsEl()?.textContent ?? ''
    expect(css).not.toContain('red')
    expect(css).toContain('--bee-nested: #f59e0b;')
  })
})

describe('clearHoverVars', () => {
  it('removes the injected <style>', () => {
    setHoverVars(document, VALID)
    expect(varsEl()).not.toBeNull()
    clearHoverVars(document)
    expect(varsEl()).toBeNull()
  })
})
