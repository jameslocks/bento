# Panko Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Panko — a mischievous circular robot character that appears as a very rare recurring event with behavior that evolves by visit count.

**Architecture:** New `src/panko.js` with `PankoEvent` class. Bento creates an instance and runs it in `_update()` / `_draw()`. Visit count tracked in localStorage.

**Tech Stack:** Vanilla JS, Canvas API, Web Audio API

## Global Constraints

- Zero external dependencies
- Very rare: ~2% chance every 15-20s (same check timer as accessories)
- Only when idle, no event, no accessory active
- Does not trigger if Panko visited in last 5 minutes
- Visit count tracked in localStorage `bento:pankoData`

---

### Task 1: Add Panko Sound to SoundEngine

**Files:**
- Modify: `bento/src/sound.js`

- [ ] **Step 1: Add panko() method**

After `fireflyChirp()`, add:

```js
  panko() {
    this._ensureContext()
    if (!this._ctx) return

    const now = this._ctx.currentTime
    const osc = this._ctx.createOscillator()
    const gain = this._ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.setValueAtTime(600, now + 0.2)
    osc.frequency.setValueAtTime(400, now + 0.3)
    osc.frequency.setValueAtTime(600, now + 0.5)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.6)

    osc.connect(gain)
    gain.connect(this._ctx.destination)

    osc.start(now)
    osc.stop(now + 0.6)
  }
```

- [ ] **Step 2: Verify build**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add bento/src/sound.js
git commit -m "feat: add panko sound to SoundEngine"
```

---

### Task 2: Create PankoEvent Module

**Files:**
- Create: `bento/src/panko.js`

**Interfaces:**
- Produces: `class PankoEvent` with `start(bento)`, `update(dt)`, `draw(ctx)`, `isActive()`

- [ ] **Step 1: Create src/panko.js**

```js
const STORAGE_KEY = 'bento:pankoData'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { visitCount: 0, lastVisit: null }
  } catch { return { visitCount: 0, lastVisit: null } }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export class PankoEvent {
  constructor() {
    this._data = loadData()
    this.active = false
    this.x = 0; this.y = 0
    this.targetX = 0; this.targetY = 0
    this.phase = 'entering'
    this.phaseTimer = 0
    this.speed = 0
    this.eyeShape = 'neutral'
    this.eyeTimer = 0
    this.antennaBlink = false
    this.blinkTimer = 0
    this.rotation = 0
    this.visitCount = this._data.visitCount
    this._bento = null
  }

  start(bento) {
    this._bento = bento
    this.active = true
    this.phase = 'entering'
    this.phaseTimer = 0
    this.rotation = 0
    this.eyeShape = 'neutral'

    this._data.visitCount++
    this._data.lastVisit = new Date().toISOString().slice(0, 10)
    saveData(this._data)
    this.visitCount = this._data.visitCount

    // Determine behavior phase
    if (this.visitCount <= 2) {
      this.speed = 1.5
      // Enter from random edge
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 16; this.targetY = 16
    } else if (this.visitCount <= 5) {
      this.speed = 2
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 22; this.targetY = 16
    } else if (this.visitCount <= 10) {
      this.speed = 3
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 16; this.targetY = 16
    } else {
      this.speed = 4
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 10; this.targetY = 16
    }

    if (bento && bento.sound && bento.sound.panko) {
      bento.sound.panko()
    }
  }

  update(dt) {
    if (!this.active) return

    this.phaseTimer += dt
    this.blinkTimer += dt
    if (this.blinkTimer > 0.3) {
      this.antennaBlink = !this.antennaBlink
      this.blinkTimer = 0
    }

    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (this.phase === 'entering') {
      if (dist < 0.5) {
        this.x = this.targetX
        this.y = this.targetY
        if (this.visitCount <= 2) {
          this.phase = 'pause'
          this.phaseTimer = 0
          this.eyeShape = 'neutral'
        } else if (this.visitCount <= 5) {
          this.phase = 'circling'
          this.phaseTimer = 0
          this.eyeShape = 'happy'
          this._orbitAngle = 0
        } else if (this.visitCount <= 10) {
          this.phase = 'bump'
          this.phaseTimer = 0
          this.eyeShape = 'happy'
        } else {
          this.phase = 'circling'
          this.phaseTimer = 0
          this.eyeShape = 'suspicious'
          this._orbitAngle = 0
          this._orbitCount = 0
        }
      } else {
        this.x += (dx / dist) * this.speed * dt * 60
        this.y += (dy / dist) * this.speed * dt * 60
      }
    }

    if (this.phase === 'pause') {
      if (this.phaseTimer > 2) {
        this.phase = 'exiting'
        this.phaseTimer = 0
        this.eyeShape = 'neutral'
        const edges = [[-5, 16], [37, 16], [16, -5], [16, 37]]
        const e = edges[Math.floor(Math.random() * 4)]
        this.targetX = e[0]
        this.targetY = e[1]
      }
    }

    if (this.phase === 'circling') {
      this._orbitAngle += dt * 2
      this.x = 16 + 6 * Math.cos(this._orbitAngle)
      this.y = 16 + 6 * Math.sin(this._orbitAngle)
      if (this._orbitAngle > Math.PI * 2) {
        if (this.visitCount > 10) {
          this._orbitCount = (this._orbitCount || 0) + 1
          if (this._orbitCount >= 2) {
            this.phase = 'bump'
            this.phaseTimer = 0
            this.eyeShape = 'happy'
            this._orbitAngle = 0
          } else {
            this._orbitAngle = 0
            this.eyeTimer = 0
          }
        } else {
          this.phase = 'exiting'
          this.phaseTimer = 0
          this.eyeShape = 'neutral'
          const edges = [[-5, 16], [37, 16], [16, -5], [16, 37]]
          const e = edges[Math.floor(Math.random() * 4)]
          this.targetX = e[0]
          this.targetY = e[1]
        }
      }
      this.eyeTimer += dt
      if (this.eyeTimer > 1) {
        this.eyeShape = this.eyeShape === 'happy' ? 'neutral' : 'happy'
        this.eyeTimer = 0
      }
    }

    if (this.phase === 'bump') {
      if (this.phaseTimer < 0.5) {
        this.x = 15; this.y = 16
      } else if (this.phaseTimer < 1.5) {
        this.rotation += dt * 6
        this.eyeShape = 'happy'
      } else {
        this.phase = 'exiting'
        this.phaseTimer = 0
        this.eyeShape = 'neutral'
        const edges = [[-5, 16], [37, 16], [16, -5], [16, 37]]
        const e = edges[Math.floor(Math.random() * 4)]
        this.targetX = e[0]
        this.targetY = e[1]
      }
    }

    if (this.phase === 'exiting') {
      if (dist < 0.5) {
        this.active = false
      } else {
        this.x += (dx / dist) * this.speed * dt * 60
        this.y += (dy / dist) * this.speed * dt * 60
      }
    }
  }

  draw(ctx, scale, bounceOffset) {
    if (!this.active) return

    const s = scale
    const px = this.x * s
    const py = this.y * s + bounceOffset

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(this.rotation)
    ctx.translate(-px, -py)

    // Body
    ctx.fillStyle = '#ff8a65'
    ctx.strokeStyle = '#ffd54f'
    ctx.lineWidth = Math.max(1, 0.8 * s)
    ctx.beginPath()
    ctx.arc(px, py, 4 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Antenna
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = Math.max(1, 1 * s)
    ctx.beginPath()
    ctx.moveTo(px, py - 4 * s)
    ctx.lineTo(px, py - 6 * s)
    ctx.stroke()

    ctx.fillStyle = this.antennaBlink ? '#ffd54f' : '#ffffff'
    ctx.beginPath()
    ctx.arc(px, py - 6.5 * s, 1 * s, 0, Math.PI * 2)
    ctx.fill()

    // Eye
    if (this.eyeShape === 'neutral') {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 1.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 0.8 * s, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.eyeShape === 'happy') {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = Math.max(1, 1 * s)
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 1 * s, 1.5 * s, Math.PI, 0)
      ctx.stroke()
    } else if (this.eyeShape === 'suspicious') {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 1.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 0.5 * s, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  isActive() {
    return this.active
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```
Expected: 16 modules transformed, no errors

- [ ] **Step 3: Commit**

```bash
git add bento/src/panko.js
git commit -m "feat: add PankoEvent class with evolving behavior by visit count"
```

---

### Task 3: Wire Panko into Bento

**Files:**
- Modify: `bento/src/bento.js`

- [ ] **Step 1: Import PankoEvent**

Add at top of `bento/src/bento.js`:
```js
import { PankoEvent } from './panko.js'
```

- [ ] **Step 2: Add Panko state to constructor**

Add after the firefly block:
```js
    this._panko = null
    this._pankoCheckTimer = 15 + Math.random() * 10
    this._lastPankoTime = 0
```

- [ ] **Step 3: Add Panko update to _update()**

After the firefly update block, add:
```js
    // Panko event
    if (this._panko && this._panko.isActive()) {
      this._panko.update(dt)
      if (!this._panko.isActive()) {
        this._panko = null
        this._lastPankoTime = this._time
      }
    } else if (!this._panko && this.mood === 'idle' && !this._event && !this._accessory) {
      if (this._time - this._lastPankoTime > 300) {
        this._pankoCheckTimer -= dt
        if (this._pankoCheckTimer <= 0) {
          if (Math.random() < 0.02) {
            this._panko = new PankoEvent()
            this._panko.start(this)
          }
          this._pankoCheckTimer = 15 + Math.random() * 10
        }
      }
    }
```

- [ ] **Step 4: Add Panko draw to _draw()**

After `this._drawFirefly(ctx)`, add:
```js
    if (this._panko && this._panko.isActive()) {
      this._panko.draw(ctx, this._scale, this._getBounceOffset())
    }
```

- [ ] **Step 5: Verify build**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add bento/src/bento.js
git commit -m "feat: wire Panko event into Bento update/draw cycle"
```