import { describe, it, expect, beforeEach } from 'vitest'
import { BondingTracker, localDateString } from '../src/bonding.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null }
  setItem(k, v) { this.map.set(k, String(v)) }
  removeItem(k) { this.map.delete(k) }
}

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime()

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

describe('BondingTracker streaks', () => {
  it('starts at 1 on the first visit and reports the first milestone', () => {
    const t = new BondingTracker(() => at(2026, 1, 1))
    expect(t.getStreak()).toBe(1)
    const r = t.checkAndUpdate()
    expect(r.isNew).toBe(true)
    expect(r.milestone.key).toBe('antennaPulse')
    expect(t.checkAndUpdate().isNew).toBe(false)
  })

  it('increments on consecutive days and resets after a gap', () => {
    new BondingTracker(() => at(2026, 1, 1))
    expect(new BondingTracker(() => at(2026, 1, 2)).getStreak()).toBe(2)
    expect(new BondingTracker(() => at(2026, 1, 2, 23)).getStreak()).toBe(2)
    expect(new BondingTracker(() => at(2026, 1, 5)).getStreak()).toBe(1)
  })

  it('counts days in local time, not UTC', () => {
    // 23:30 local on the 1st may already be the 2nd in UTC; it is still the 1st locally.
    const late = new Date(2026, 0, 1, 23, 30)
    expect(localDateString(late)).toBe('2026-01-01')
  })

  it('reports a milestone reached on the next day', () => {
    let now = at(2026, 1, 1)
    const t = new BondingTracker(() => now)
    t.checkAndUpdate()
    for (let day = 2; day <= 5; day++) {
      now = at(2026, 1, day)
      const r = t.checkAndUpdate()
      if (day === 5) expect(r.milestone.key).toBe('crown')
    }
  })

  it('expires effects after their duration', () => {
    let now = at(2026, 1, 1)
    const t = new BondingTracker(() => now)
    expect(t.hasEffect('antennaPulse')).toBe(true)
    now += 301 * 1000
    expect(t.hasEffect('antennaPulse')).toBe(false)
  })
})
