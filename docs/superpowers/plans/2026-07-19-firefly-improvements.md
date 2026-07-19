# Firefly Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve firefly with figure-8 path, trail, tap interaction, chirp sound, and increased rarity.

**Architecture:** Modify existing `_firefly` state and methods in `bento.js`. Add `fireflyChirp()` to `sound.js`. All changes are in existing files.

**Tech Stack:** Vanilla JS, Canvas API, Web Audio API

## Global Constraints

- Zero external dependencies
- Firefly must keep current size
- Firefly timer range increased from `20 + random() * 20` to `60 + random() * 30`
- Tap interaction: within 3 grid units of firefly position
- Trail: last 8 positions, fading alpha
- Sound: sine wave 1200Hz → 800Hz over 0.15s

---

### Task 1: Add Firefly Sound to SoundEngine

**Files:**
- Modify: `bento/src/sound.js:238`

**Interfaces:**
- Produces: `sound.fireflyChirp()` method

- [ ] **Step 1: Add fireflyChirp() method**

After the closing `}` of `dizzy()` (line 237), add before the closing `}` of the class:

```js
  fireflyChirp() {
    this._ensureContext()
    if (!this._ctx) return

    const now = this._ctx.currentTime
    const osc = this._ctx.createOscillator()
    const gain = this._ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.15)

    osc.connect(gain)
    gain.connect(this._ctx.destination)

    osc.start(now)
    osc.stop(now + 0.15)
  }
```

- [ ] **Step 2: Verify**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 15 modules transformed, no errors

- [ ] **Step 3: Commit**

```bash
git add bento/src/sound.js
git commit -m "feat: add fireflyChirp sound to SoundEngine"
```

---

### Task 2: Improve Firefly Movement, Trail, Tap, Rarity

**Files:**
- Modify: `bento/src/bento.js:72-81` (constructor firefly state)
- Modify: `bento/src/bento.js:527-549` (drawFirefly method)
- Modify: `bento/src/bento.js:338-376` (handleTap — add firefly interaction)

**Interfaces:**
- Consumes: `sound.fireflyChirp()`
- Produces: improved firefly with figure-8 path, trail, tap sparkle burst

- [ ] **Step 1: Update constructor firefly state**

Replace lines 72-81 with:

```js
    // Firefly
    this._firefly = {
      active: false,
      timer: 60 + Math.random() * 30,
      x: 16, y: 16,
      angle: 0,
      speed: 1.5,
      radius: 12,
      duration: 8,
      elapsed: 0
    }
    this._fireflyTrail = []
```

- [ ] **Step 2: Update firefly movement in _update()**

Find the firefly update block. Replace it with figure-8 movement:

```js
    // Update firefly
    if (this._firefly.active) {
      this._firefly.elapsed += dt
      this._firefly.angle += this._firefly.speed * dt

      const cx = 16
      const radius = this._firefly.radius
      this._firefly.x = cx + radius * Math.sin(this._firefly.angle)
      this._firefly.y = 16 + radius * Math.sin(2 * this._firefly.angle)

      // Trail
      this._fireflyTrail.push({ x: this._firefly.x, y: this._firefly.y })
      if (this._fireflyTrail.length > 8) {
        this._fireflyTrail.shift()
      }

      if (this._firefly.elapsed >= this._firefly.duration) {
        this._firefly.active = false
        this._fireflyTrail = []
      }
    }
```

- [ ] **Step 3: Update _drawFirefly()**

Replace lines 527-549 with:

```js
  _drawFirefly(ctx) {
    if (!this._firefly.active) return

    const s = this._scale
    const bx = this._firefly.x * s
    const by = this._firefly.y * s + this._getBounceOffset()
    const glow = Math.sin(this._time * 4 + this._firefly.angle) * 0.3 + 0.7
    const fadeIn = Math.min(1, this._firefly.elapsed / 0.5)
    const fadeOut = Math.min(1, (this._firefly.duration - this._firefly.elapsed) / 0.5)
    const alpha = glow * fadeIn * fadeOut

    // Trail
    const trailCount = this._fireflyTrail.length
    for (let i = 0; i < trailCount; i++) {
      const t = this._fireflyTrail[i]
      const tAlpha = (i / trailCount) * alpha * 0.4
      const tSize = (0.5 + (i / trailCount) * 1.5) * s
      ctx.fillStyle = `rgba(100, 255, 150, ${tAlpha})`
      ctx.beginPath()
      ctx.arc(t.x * s, t.y * s + this._getBounceOffset(), tSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Glow
    ctx.fillStyle = `rgba(100, 255, 150, ${alpha * 0.3})`
    ctx.beginPath()
    ctx.arc(bx, by, 3 * s, 0, Math.PI * 2)
    ctx.fill()

    // Core
    ctx.fillStyle = `rgba(180, 255, 200, ${alpha})`
    ctx.beginPath()
    ctx.arc(bx, by, 1.5 * s, 0, Math.PI * 2)
    ctx.fill()
  }
```

- [ ] **Step 4: Add firefly tap interaction to _handleTap()**

In `_handleTap()`, after `if (this._happyCooldown > 0) return` (line 340) and before the educational mode check, add:

```js
    // Firefly tap interaction
    if (this._firefly.active) {
      const dx = 16 - this._firefly.x
      const dy = 16 - this._firefly.y
      if (Math.sqrt(dx * dx + dy * dy) < 3) {
        this._firefly.active = false
        this._firefly.timer = 60 + Math.random() * 30
        this._fireflyTrail = []
        this.sound.fireflyChirp()
        // Sparkle burst
        for (let i = 0; i < 6; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1 + Math.random() * 2
          this._spawnParticle(this._firefly.x, this._firefly.y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6 + Math.random() * 0.4,
            size: 0.3 + Math.random() * 0.3,
            type: 'spark'
          })
        }
        return
      }
    }
```

- [ ] **Step 5: Verify**

Run: `cd /mnt/d/Projects/bento/bento && npx vite build`
Expected: 15 modules transformed, no errors

- [ ] **Step 6: Commit**

```bash
git add bento/src/bento.js
git commit -m "feat: improve firefly with figure-8 path, trail, tap interaction, rarity"
```