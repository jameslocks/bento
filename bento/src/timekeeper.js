// Time-of-day phases. Each phase starts at `from` (hour, inclusive).
// Cross-fades last FADE hours at the start of a phase.
const PHASES = [
  { name: 'night', from: 0 },
  { name: 'morning', from: 6 },
  { name: 'day', from: 11 },
  { name: 'evening', from: 17 },
  { name: 'night', from: 21 }
]
const FADE = 1

function hoursNow(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60
}

export function getPeriod(date = new Date()) {
  const h = date.getHours()
  let name = PHASES[0].name
  for (const p of PHASES) if (h >= p.from) name = p.name
  return name
}

/** 0..1 blend toward the current phase's tint (ramps up at phase start). */
export function getBlend(date = new Date()) {
  const t = hoursNow(date)
  for (const p of PHASES) {
    if (p.from > 0 && t >= p.from && t < p.from + FADE) return (t - p.from) / FADE
  }
  return 1
}

export function isNight(date = new Date()) {
  return getPeriod(date) === 'night'
}
