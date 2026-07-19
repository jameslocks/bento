# Bonding/Streaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add daily streak tracking with milestone visual effects (rainbow glow, crown, sparkles, golden border, halo).

**Architecture:** New `src/bonding.js` with `BondingTracker` class using localStorage. Bento imports and checks on init. Effects are drawn in `_draw()` based on active milestones.

**Tech Stack:** Vanilla JS, Canvas API

## Global Constraints

- Zero external dependencies
- localStorage key: `bento:bonding`
- Only one visit counted per calendar day
- Streak resets if a day is skipped
- Milestone effects last 5 minutes (except 100-day = 10 minutes)

---

### Task 1: Create BondingTracker Module

**Files:**
- Create: `bento/src/bonding.js`

**Interfaces:**
- Produces: `class BondingTracker` with `getStreak()`, `getActiveMilestones()`, `addCrown()`, `removeCrown()`

- [ ] **Step 1: Create src/bonding.js**

```js
const STORAGE_KEY = 'bento:bonding'

const MILESTONES = [
  { streak: 1, key: 'rainbow' },
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
    const durations = { rainbow: 300, crown: 300, sparkles: 300, golden: 300, halo: 300, supreme: 600 }
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
```

- [ ] **Step 2: Verify module loads**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 16 modules transformed, no errors

- [ ] **Step 3: Commit**

```bash
git add bento/src/bonding.js
git commit -m "feat: add BondingTracker with daily streak and milestone detection"
```

---

### Task 2: Add Crown Accessory

**Files:**
- Modify: `bento/src/accessories.js`

**Interfaces:**
- Produces: crown draw function for milestone level 5

- [ ] **Step 1: Add crown draw function**

Add before the final `accessories.set(...)` lines:

```js
function drawCrown(ctx, palette, state, time) {
  const cx = 16
  const topY = 3

  ctx.fillStyle = '#ffd700'
  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 0.5

  // Crown shape: 3 points
  ctx.beginPath()
  ctx.moveTo(cx - 6, topY + 4)
  ctx.lineTo(cx - 6, topY - 2)
  ctx.lineTo(cx - 4, topY - 0)
  ctx.lineTo(cx, topY - 5)
  ctx.lineTo(cx + 4, topY - 0)
  ctx.lineTo(cx + 6, topY - 2)
  ctx.lineTo(cx + 6, topY + 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Jewels
  ctx.fillStyle = '#ff4081'
  ctx.beginPath()
  ctx.arc(cx, topY - 2, 0.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#4fc3f7'
  ctx.beginPath()
  ctx.arc(cx - 4, topY + 1, 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 4, topY + 1, 0.6, 0, Math.PI * 2)
  ctx.fill()
}
```

Then add to the accessories Map:
```js
accessories.set('crown', { key: 'crown', name: 'Crown', draw: drawCrown })
```

- [ ] **Step 2: Verify build**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 16 modules transformed

- [ ] **Step 3: Commit**

```bash
git add bento/src/accessories.js
git commit -m "feat: add crown accessory for streak milestone level 5"
```

---

### Task 3: Wire BondingTracker to Bento

**Files:**
- Modify: `bento/src/bento.js`
- Modify: `bento/src/main.js`

**Interfaces:**
- Consumes: BondingTracker
- Produces: milestone effects in _draw(), crown auto-apply from bonding

- [ ] **Step 1: Add bonding import and state to bento constructor**

In `bento/src/bento.js`, add at top:
```js
import { BondingTracker } from './bonding.js'
```

Add after `this._firefly` block:
```js
    this._bonding = new BondingTracker()
    this._bondCrownActive = false
```

- [ ] **Step 2: Add milestone effects to _draw()**

After `ctx.restore()` at the end of `_draw()` (after firefly draw, before `_drawParticles`), add:

```js
    // Bonding milestone effects
    if (this._bonding.hasEffect('rainbow')) {
      ctx.save()
      ctx.globalAlpha = 0.15 + Math.sin(this._time * 2) * 0.1
      ctx.fillStyle = `hsl(${(this._time * 60) % 360}, 100%, 50%)`
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.restore()
    }

    if (this._bonding.hasEffect('golden')) {
      ctx.save()
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(this._time * 1.5) * 0.2})`
      ctx.lineWidth = 2 * this._scale
      ctx.strokeRect(1 * this._scale, 1 * this._scale, (this._gridSize - 2) * this._scale, (this._gridSize - 2) * this._scale)
      ctx.restore()
    }

    if (this._bonding.hasEffect('sparkles') && Math.random() < 0.1) {
      const angle = Math.random() * Math.PI * 2
      const dist = 2 + Math.random() * 6
      this._spawnParticle(16 + Math.cos(angle) * dist, 16 + Math.sin(angle) * dist, {
        vx: Math.cos(angle) * 0.5,
        vy: Math.sin(angle) * 0.5 - 1,
        life: 0.5,
        size: 0.2,
        type: 'sparkle'
      })
    }

    if (this._bonding.hasEffect('supreme')) {
      ctx.save()
      ctx.globalAlpha = 0.1
      for (let i = 0; i < 6; i++) {
        const hue = (this._time * 30 + i * 60) % 360
        ctx.fillStyle = `hsl(${hue}, 100%, 70%)`
        ctx.beginPath()
        ctx.arc(16 * this._scale, 16 * this._scale, (8 + i * 1.5) * this._scale, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
```

- [ ] **Step 3: Add halo effect to drawAntenna in skin**

In `bento/src/skins/default.js`, at the end of `drawAntenna()`, add:

```js
    if (state && state.halo) {
      ctx.save()
      ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.15
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.ellipse(cx, topY - 3, 3, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
```

- [ ] **Step 4: Add halo to state object**

In `_draw()` state object, add:
```js
      halo: this._bonding.hasEffect('halo') || this._bonding.hasEffect('supreme'),
```

- [ ] **Step 5: Wire bonding crown auto-apply in main.js**

In `bento/src/main.js`, after `bento._checkBirthday(settings)`, add:
```js
  if (bento._bonding.hasEffect('crown') || bento._bonding.hasEffect('supreme')) {
    bento._setAccessory('crown')
  }
```

- [ ] **Step 6: Verify**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```

- [ ] **Step 7: Commit**

```bash
git add bento/src/bento.js bento/src/main.js bento/src/skins/default.js
git commit -m "feat: wire BondingTracker with milestone effects (rainbow, crown, sparkles, golden, halo)"
```