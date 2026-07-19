# Time-of-Day Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add time-of-day awareness to Bento — adjusts blink speed, baseline mood, and palette based on morning/day/evening/night periods.

**Architecture:** New `src/timekeeper.js` module wrapping `Date`. Bento imports it in `_update()`, passes `timePeriod` in the state object. Skin uses it for palette shifts.

**Tech Stack:** Vanilla JS, Canvas API

## Global Constraints

- Zero external dependencies
- No timers — pure Date checks each frame
- Periods: morning 6-11, day 12-16, evening 17-20, night 21-5
- Mood blending: time-of-day adjusts baseline, not override
- Blink: night doubles interval floor, halves speed

---

### Task 1: Create TimeKeeper Module

**Files:**
- Create: `bento/src/timekeeper.js`

**Interfaces:**
- Produces: `getPeriod()`, `getBlend()`, `isNight()`

- [ ] **Step 1: Create src/timekeeper.js**

```js
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
```

- [ ] **Step 2: Verify module loads**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 16 modules transformed, no errors

- [ ] **Step 3: Commit**

```bash
git add bento/src/timekeeper.js
git commit -m "feat: add TimeKeeper module with getPeriod, getBlend, isNight"
```

---

### Task 2: Integrate Time-of-Day into Bento

**Files:**
- Modify: `bento/src/bento.js`

**Interfaces:**
- Consumes: `getPeriod()`, `getBlend()`, `isNight()` from timekeeper.js
- Produces: `timePeriod` in state object, adjusted blink behavior

- [ ] **Step 1: Import TimeKeeper**

Add at top of `bento/src/bento.js`:
```js
import { getPeriod, getBlend, isNight } from './timekeeper.js'
```

- [ ] **Step 2: Add time period to state object**

In `_draw()`, add after `time: this._time` in the state object:
```js
      timePeriod: getPeriod(),
      timeBlend: getBlend(),
```

- [ ] **Step 3: Adjust blink in _update()**

In `_updateBlink()`, modify the blink interval calculation. If `isNight()`, double the interval floor and blink duration:

Find the existing blink logic (around line 178-195). The blink interval is `this._nextBlink = 2 + Math.random() * 4`. Add a night check:

```js
    if (isNight()) {
      // Night: slower, heavier blink
      blinkInterval = 4 + Math.random() * 6
      blinkDuration = 0.25
    }
```

- [ ] **Step 4: Verify**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 16 modules transformed, no errors

- [ ] **Step 5: Commit**

```bash
git add bento/src/bento.js
git commit -m "feat: integrate time-of-day awareness into Bento (blink, state)"
```

---

### Task 3: Add Time-of-Day Palette to Skin

**Files:**
- Modify: `bento/src/skins/default.js`

**Interfaces:**
- Consumes: `state.timePeriod`, `state.timeBlend` from bento.js

- [ ] **Step 1: Add period-based palette shift to drawHead()**

In `drawHead()`, after the state event checks (around line 54), add a time-of-day palette adjustment:

```js
    // Time-of-day palette shift
    if (state && state.timePeriod) {
      if (state.timePeriod === 'evening') {
        ctx.fillStyle = '#c8a050'  // warm gold for visor
      } else if (state.timePeriod === 'night') {
        ctx.fillStyle = '#556'  // muted blue-gray for visor
      }
    }
```

- [ ] **Step 2: Verify**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 16 modules transformed, no errors

- [ ] **Step 3: Commit**

```bash
git add bento/src/skins/default.js
git commit -m "feat: add time-of-day palette shift to skin"
```