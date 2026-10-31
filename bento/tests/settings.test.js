import { describe, it, expect, beforeEach } from 'vitest'
import { SettingsStore, DEFAULTS } from '../src/settings.js'

beforeEach(() => {
  const map = new Map()
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  }
})

describe('SettingsStore', () => {
  it('falls back to defaults for unset or blank values', () => {
    const s = new SettingsStore()
    expect(s.get('voiceModel')).toBe(DEFAULTS.voiceModel)
    s.set('voiceModel', '')
    expect(s.get('voiceModel')).toBe(DEFAULTS.voiceModel)
  })

  it('stores educationalMode as a boolean, including legacy values', () => {
    localStorage.setItem('bento:settings', JSON.stringify({ educationalMode: 'on' }))
    expect(new SettingsStore().get('educationalMode')).toBe(true)
    localStorage.setItem('bento:settings', JSON.stringify({ educationalMode: '' }))
    expect(new SettingsStore().get('educationalMode')).toBe(false)
  })
})
