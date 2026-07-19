export function getPeriod() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function getBlend() {
  const hour = new Date().getHours()
  const min = new Date().getMinutes()
  const t = hour + min / 60
  // 1-hour transition at each boundary
  if (t >= 6 && t < 7) return (t - 6) / 1       // morning fade-in
  if (t >= 10 && t < 11) return 1 - (t - 10) / 1 // morning fade-out
  if (t >= 17 && t < 18) return (t - 17) / 1     // evening fade-in
  if (t >= 20 && t < 21) return 1 - (t - 20) / 1 // evening fade-out
  if (t >= 21 && t < 22) return (t - 21) / 1     // night fade-in
  if (t >= 5 && t < 6) return 1 - (t - 5) / 1    // night fade-out
  return 1
}

export function isNight() {
  return getPeriod() === 'night'
}