import { describe, it, expect } from 'vitest'
import { getPeriod, getBlend, isNight } from '../src/timekeeper.js'

const at = (h, m = 0) => new Date(2026, 0, 1, h, m)

describe('timekeeper', () => {
  it('maps hours to periods', () => {
    expect(getPeriod(at(5, 59))).toBe('night')
    expect(getPeriod(at(6))).toBe('morning')
    expect(getPeriod(at(11))).toBe('day')
    expect(getPeriod(at(17))).toBe('evening')
    expect(getPeriod(at(21))).toBe('night')
    expect(getPeriod(at(0))).toBe('night')
  })

  it('fades in over an hour at the start of a phase', () => {
    expect(getBlend(at(6))).toBe(0)
    expect(getBlend(at(6, 30))).toBeCloseTo(0.5)
    expect(getBlend(at(8))).toBe(1)
  })

  it('isNight', () => {
    expect(isNight(at(23))).toBe(true)
    expect(isNight(at(12))).toBe(false)
  })
})
