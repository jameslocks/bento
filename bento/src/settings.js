const PREFIX = 'bento:'

export const DEFAULTS = Object.freeze({
  apiEndpoint: '',
  apiKey: '',
  kidName: '',
  birthMonth: '',
  birthDay: '',
  educationalMode: false,
  voiceModel: 'openai/gpt-4o-mini-tts-2025-12-15',
  voiceSpeed: '1.0',
  voiceInstructions: ''
})

function normalise(data) {
  const out = { ...data }
  // Older versions stored the checkbox as '' / 'on'.
  if ('educationalMode' in out) out.educationalMode = Boolean(out.educationalMode)
  return out
}

export class SettingsStore {
  constructor() {
    this._data = normalise(this._load())
  }

  _load() {
    try {
      const raw = localStorage.getItem(`${PREFIX}settings`)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  _save() {
    try {
      localStorage.setItem(`${PREFIX}settings`, JSON.stringify(this._data))
    } catch {
      // Storage full or unavailable: settings just won't persist
    }
  }

  get(key) {
    const value = this._data[key]
    // Treat empty strings as "unset" so blank inputs fall back to defaults.
    return value === undefined || value === '' ? DEFAULTS[key] : value
  }

  set(key, value) {
    this._data = normalise({ ...this._data, [key]: value })
    this._save()
  }

  getAll() {
    const all = { ...DEFAULTS }
    for (const key of Object.keys(this._data)) all[key] = this.get(key)
    return all
  }

  clear() {
    this._data = {}
    this._save()
  }
}
