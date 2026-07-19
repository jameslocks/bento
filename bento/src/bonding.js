const STORAGE_KEY = 'bento:bonding'

const MILESTONES = [
  { streak: 1, key: 'antennaPulse' },
  { streak: 5, key: 'crown' },
  { streak: 10, key: 'sparkles' },
  { streak: 25, key: 'golden' },
  { streak: 50, key: 'halo' },
  { streak: 100, key: 'supreme' }
]

export class BondingTracker {
  constructor() {
    this._data = this._load()
    this._streak = this._computeStreak()
    this._activeEffects = []
    this._effectTimers = {}
    this._applyMilestones()
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : { lastVisit: null, streak: 0, notified: [] }
    } catch { return { lastVisit: null, streak: 0, notified: [] } }
  }

  _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data)) } catch {}
  }

  _computeStreak() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    if (this._data.lastVisit === dateStr) {
      return this._data.streak
    }

    let newStreak
    if (this._data.lastVisit === yesterdayStr) {
      newStreak = this._data.streak + 1
    } else if (this._data.lastVisit !== dateStr) {
      newStreak = 1
    } else {
      newStreak = this._data.streak
    }

    this._data.lastVisit = dateStr
    this._data.streak = newStreak
    this._save()
    return newStreak
  }

  getStreak() { return this._streak }

  checkAndUpdate() {
    const prevCount = this._data.notified.length
    this._streak = this._computeStreak()
    this._applyMilestones()
    const newNotified = this._data.notified.slice(prevCount)
    if (newNotified.length > 0) {
      const milestone = MILESTONES.find(m => m.streak === newNotified[0])
      return { streak: this._streak, milestone, isNew: true }
    }
    return { streak: this._streak, milestone: null, isNew: false }
  }

  _applyMilestones() {
    for (const m of MILESTONES) {
      if (this._streak >= m.streak && !this._data.notified.includes(m.streak)) {
        this._data.notified.push(m.streak)
        this._save()
      }
    }
    this._updateActiveEffects()
  }

  _updateActiveEffects() {
    this._activeEffects = []
    const durations = { antennaPulse: 300, crown: 300, sparkles: 300, golden: 300, halo: 300, supreme: 600 }
    const now = Date.now()

    for (const m of MILESTONES) {
      if (this._streak >= m.streak) {
        if (!this._effectTimers[m.key] || now < this._effectTimers[m.key]) {
          this._activeEffects.push(m.key)
          if (!this._effectTimers[m.key]) {
            this._effectTimers[m.key] = now + (durations[m.key] || 300) * 1000
          }
        }
      }
    }
  }

  getActiveMilestones() {
    this._updateActiveEffects()
    return this._activeEffects
  }

  hasEffect(key) {
    this._updateActiveEffects()
    return this._activeEffects.includes(key)
  }
}
