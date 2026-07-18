# Mobile Sizing & Shake-to-Dizzy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bento's canvas fill more viewport on mobile, and react to phone shakes with a dizzy animation.

**Architecture:** New `ShakeDetector` class follows the existing `SoundEngine` pattern. Dizzy is a new event type in the existing event system. Canvas resize is a single formula change.

**Tech Stack:** Vanilla JS, Canvas API, Web Audio API, DeviceMotion API

## Global Constraints

- No external dependencies
- Must work on mobile browsers with DeviceMotionEvent support
- Desktop must gracefully no-op (no errors)
- All new code follows existing patterns in the codebase

---

### Task 1: Canvas Resize

**Files:**
- Modify: `src/bento.js:81-89`

**Interfaces:**
- Consumes: nothing
- Produces: updated `_resize()` method

- [ ] **Step 1: Change `_resize()` formula**

```js
_resize() {
  const displaySize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8)
  this._scale = Math.max(4, Math.floor(displaySize / this._gridSize))
  const size = Math.min(this._gridSize * this._scale, 640)
  this.canvas.width = size
  this.canvas.height = size
  this.canvas.style.width = size + 'px'
  this.canvas.style.height = size + 'px'
}
```

- [ ] **Step 2: Verify**

Run: `npm run dev` — check canvas size on phone emulation and desktop. On phone (390x844) expect ~351px. On desktop (1920x1080) expect 640px max.

- [ ] **Step 3: Commit**

```bash
git add src/bento.js
git commit -m "feat: responsive canvas sizing — fills mobile, capped at 640px on desktop"
```

---

### Task 2: Create ShakeDetector

**Files:**
- Create: `src/shake.js`

**Interfaces:**
- Consumes: nothing
- Produces: `ShakeDetector` class with constructor `(onShake, threshold=20, cooldown=3)` and `destroy()` method

- [ ] **Step 1: Write `src/shake.js`**

```js
export class ShakeDetector {
  constructor(onShake, threshold = 20, cooldown = 3) {
    this._onShake = onShake
    this._threshold = threshold
    this._cooldown = cooldown
    this._lastShake = 0
    this._handler = null

    if ('DeviceMotionEvent' in window) {
      this._handler = (e) => this._handle(e)
      window.addEventListener('devicemotion', this._handler)
    }
  }

  _handle(e) {
    const a = e.accelerationIncludingGravity
    if (!a) return
    const total = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
    const now = performance.now()
    if (total > this._threshold && (now - this._lastShake) > this._cooldown * 1000) {
      this._lastShake = now
      this._onShake()
    }
  }

  destroy() {
    if (this._handler) {
      window.removeEventListener('devicemotion', this._handler)
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shake.js
git commit -m "feat: add ShakeDetector class for device shake detection"
```

---

### Task 3: Add Dizzy Event and triggerDizzy() to Bento

**Files:**
- Modify: `src/bento.js`

**Interfaces:**
- Consumes: `ShakeDetector` from Task 2 (calls `bento.triggerDizzy()`)
- Produces: `triggerDizzy()` method, `dizzy` event in state, bounce offset and body wobble

- [ ] **Step 1: Add `dizzy: 2.0` to `this._events`** (after line 52 in `bento.js`)

- [ ] **Step 2: Add `triggerDizzy()` method**

```js
triggerDizzy() {
  this.mood = 'idle'
  this._event = 'dizzy'
  this._eventTime = 0
  this.sound.dizzy()
}
```

- [ ] **Step 3: Add `dizzy` branch in `_getBounceOffset()`** (after the sneeze block)

```js
if (this._event === 'dizzy') {
  const p = this._eventTime / this._events.dizzy
  const decay = 1 - p
  return Math.sin(this._eventTime * 40) * 3 * this._scale * decay
}
```

- [ ] **Step 4: Add body wobble rotation in `_draw()`** (before the `state` object is created)

```js
if (this._event === 'dizzy') {
  const p = this._eventTime / this._events.dizzy
  const decay = 1 - p
  ctx.translate(16 * this._scale, 16 * this._scale)
  ctx.rotate(Math.sin(this._eventTime * 30) * 0.05 * decay)
  ctx.translate(-16 * this._scale, -16 * this._scale)
}
```

- [ ] **Step 5: Verify and commit**

```bash
git add src/bento.js
git commit -m "feat: add dizzy event and triggerDizzy() to Bento"
```

---

### Task 4: Add Dizzy Sound

**Files:**
- Modify: `src/sound.js`

**Interfaces:**
- Consumes: nothing
- Produces: `dizzy()` method on `SoundEngine`

- [ ] **Step 1: Add `dizzy()` method**

```js
dizzy() {
  this._ensureContext()
  if (!this._ctx) return

  const now = this._ctx.currentTime

  const osc = this._ctx.createOscillator()
  const gain = this._ctx.createGain()
  const lfo = this._ctx.createOscillator()
  const lfoGain = this._ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(800, now)
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.4)

  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(30, now)
  lfoGain.gain.setValueAtTime(100, now)
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  gain.gain.setValueAtTime(0.15, now)
  gain.gain.linearRampToValueAtTime(0, now + 0.4)

  osc.connect(gain)
  gain.connect(this._ctx.destination)

  osc.start(now)
  lfo.start(now)
  osc.stop(now + 0.4)
  lfo.stop(now + 0.4)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/sound.js
git commit -m "feat: add dizzy sound effect — descending wobble with vibrato"
```

---

### Task 5: Draw Dizzy Eyes in Skin

**Files:**
- Modify: `src/skins/default.js`

**Interfaces:**
- Consumes: `state.event === 'dizzy'`, `state.eventTime`, `state.events.dizzy` (duration 2.0)
- Produces: dizzy eye rendering in default skin

- [ ] **Step 1: Add `dizzy` branch in `drawEyes()`** (after the `glitch` branch, before `sleeping`)

```js
} else if (state.event === 'dizzy') {
  const p = state.eventTime / 2.0
  const orbitR = 2.5
  const angle = p * Math.PI * 4
  const decay = 1 - p

  // Donut trail
  ctx.strokeStyle = `rgba(79, 195, 247, ${0.3 * decay})`
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.arc(cx - 4, eyeY, orbitR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx + 4, eyeY, orbitR, 0, Math.PI * 2)
  ctx.stroke()

  // Eye dots
  ctx.fillStyle = palette.eye
  ctx.beginPath()
  ctx.arc(cx - 4 + Math.cos(angle) * orbitR, eyeY + Math.sin(angle) * orbitR, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 4 + Math.cos(angle + Math.PI) * orbitR, eyeY + Math.sin(angle + Math.PI) * orbitR, 1.5, 0, Math.PI * 2)
  ctx.fill()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skins/default.js
git commit -m "feat: dizzy eyes — donut orbit animation with trail"
```

---

### Task 6: Wire ShakeDetector in main.js

**Files:**
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `ShakeDetector` from Task 2, `bento.triggerDizzy()` from Task 3
- Produces: fully wired app

- [ ] **Step 1: Import `ShakeDetector` and wire it up**

Add import at top of `main.js`:
```js
import { ShakeDetector } from './shake.js'
```

After `bento.start()`:
```js
const shake = new ShakeDetector(() => bento.triggerDizzy())
```

- [ ] **Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat: wire ShakeDetector to Bento dizzy reaction"
```

---

### Verification

- [ ] `npm run dev` — check canvas fills phone viewport, capped on desktop
- [ ] On mobile: shake device → Bento bounces, eyes spin in donuts, descending wobble sound
- [ ] On desktop: no errors, Bento works normally