const STORAGE_KEY = 'bento:bonding'

// Effects are a per-visit celebration: each reached milestone's effect plays
// for `duration` seconds after it is first seen in this page session.
const MILESTONES = [
  { streak: 1, key: 'antennaPulse', duration: 300 },
  { streak: 5, key: 'crown', duration: 300 },
  { streak: 10, key: 'sparkles', duration: 300 },
  { streak: 25, key: 'golden', duration: 300 },
  { streak: 50, key: 'halo', duration: 300 },
  { streak: 100, key: 'supreme', duration: 600 }
]

const EMPTY = () => ({ lastVisit: null, streak: 0, notified: [] })

/** Local (not UTC) calendar date as YYYY-MM-DD. */
export function localDateString(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export class BondingTracker {
  constructor(now = () => Date.now()) {
    this._now = now
    this._data = this._load()
    this._streak = this._data.streak
    this._effectEnds = {}
    this._pendingNew = []
    this._refresh() // milestones reached on load are reported by the first checkAndUpdate()
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? { ...EMPTY(), ...JSON.parse(raw) } : EMPTY()
    } catch {
      return EMPTY()
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data))
    } catch {
      // Storage unavailable: streak simply won't persist
    }
  }

  _advanceStreak() {
    const today = new Date(this._now())
    const todayStr = localDateString(today)
    if (this._data.lastVisit === todayStr) return

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    this._data.streak = this._data.lastVisit === localDateString(yesterday)
      ? this._data.streak + 1
      : 1
    this._data.lastVisit = todayStr
    this._save()
  }

  getStreak() { return this._streak }

  /**
   * Re-check the date (cheap; call occasionally, e.g. once a minute) and
   * return { streak, milestone, isNew }. `milestone` is the newest milestone
   * reached since the last call, including ones reached at construction.
   */
  checkAndUpdate() {
    this._refresh()
    const milestone = this._pendingNew.pop() ?? null
    this._pendingNew = []
    return { streak: this._streak, milestone, isNew: milestone !== null }
  }

  _refresh() {
    this._advanceStreak()
    this._streak = this._data.streak

    const now = this._now()
    for (const m of MILESTONES) {
      if (this._streak < m.streak) continue
      if (!(m.key in this._effectEnds)) {
        this._effectEnds[m.key] = now + m.duration * 1000
      }
      if (!this._data.notified.includes(m.streak)) {
        this._data.notified.push(m.streak)
        this._pendingNew.push(m)
        this._save()
      }
    }
  }

  getActiveMilestones() {
    return Object.keys(this._effectEnds).filter(k => this.hasEffect(k))
  }

  hasEffect(key) {
    return this._now() < (this._effectEnds[key] ?? 0)
  }
}
