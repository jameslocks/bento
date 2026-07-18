const PREFIX = 'bento:'

export class SettingsStore {
  constructor() {
    this._data = this._load()
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
      // Storage full or unavailable — silently fail
    }
  }

  get(key) {
    return this._data[key]
  }

  set(key, value) {
    this._data[key] = value
    this._save()
  }

  getAll() {
    return { ...this._data }
  }

  clear() {
    this._data = {}
    this._save()
  }
}
