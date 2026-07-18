# Phase 2: Accessories — Party Hat, Bowtie, Sunglasses, Earmuffs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pixel-art accessory system for Bento — party hat, bowtie, sunglasses, earmuffs — as very rare random events (~10-15 min) with auto-apply on the kid's birthday.

**Architecture:** Accessories are defined in a separate module (`accessories.js`) with draw functions. The skin interface gains a new `drawAccessory(ctx, palette, state, time)` method called by Bento's render loop. Bento's state machine gains accessory tracking (current accessory, timer, random check, birthday check). The `SettingsStore` birthday is read on init to auto-apply party hat on the matching day.

**Tech Stack:** Vanilla JS, Canvas API

## Global Constraints

- Zero external dependencies
- Accessories are drawn on canvas (pixel art matching Bento's style)
- Each accessory must be a separate draw function in `accessories.js`
- Accessory duration: 2-3 minutes (random between 120-180s)
- Random event check: every 10-15 seconds (same as existing event system), success rate ~5% for very rare feel
- Birthday auto-apply: party hat guaranteed on matching month/day, no random accessory while birthday hat is active
- Backwards compatible — existing events and moods unchanged

---

### Task 1: Create Accessory Definitions

**Files:**
- Create: `bento/src/accessories.js`

**Interfaces:**
- Produces: `accessories` Map with `{ key, name, draw(ctx, palette, state, time) }` entries

- [ ] **Step 1: Create src/accessories.js**

```js
export const accessories = new Map()

function drawPartyHat(ctx, palette, state, time) {
  const cx = 16
  const topY = 4

  // Cone
  ctx.fillStyle = '#ff4081'
  ctx.beginPath()
  ctx.moveTo(cx, topY - 7)
  ctx.lineTo(cx - 6, topY + 2)
  ctx.lineTo(cx + 6, topY + 2)
  ctx.closePath()
  ctx.fill()

  // Brim
  ctx.fillStyle = '#ffd54f'
  ctx.fillRect(cx - 7, topY + 1, 14, 1.5)

  // Pompom
  ctx.fillStyle = '#ffd54f'
  ctx.beginPath()
  ctx.arc(cx, topY - 7, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Stripes
  ctx.strokeStyle = '#ffd54f'
  ctx.lineWidth = 0.5
  for (let i = 1; i <= 3; i++) {
    const t = i / 4
    const leftX = cx - 6 + t * 6
    const rightX = cx + 6 - t * 6
    const y = topY + 2 - t * 9
    ctx.beginPath()
    ctx.moveTo(leftX, y)
    ctx.lineTo(rightX, y)
    ctx.stroke()
  }
}

function drawBowtie(ctx, palette, state, time) {
  const cx = 16
  const bowY = 29

  ctx.fillStyle = '#e040fb'
  // Left wing
  ctx.beginPath()
  ctx.moveTo(cx, bowY)
  ctx.lineTo(cx - 6, bowY - 3)
  ctx.lineTo(cx - 6, bowY + 3)
  ctx.closePath()
  ctx.fill()
  // Right wing
  ctx.beginPath()
  ctx.moveTo(cx, bowY)
  ctx.lineTo(cx + 6, bowY - 3)
  ctx.lineTo(cx + 6, bowY + 3)
  ctx.closePath()
  ctx.fill()
  // Center knot
  ctx.fillStyle = '#ce93d8'
  ctx.beginPath()
  ctx.arc(cx, bowY, 1.2, 0, Math.PI * 2)
  ctx.fill()
}

function drawSunglasses(ctx, palette, state, time) {
  const cx = 16
  const eyeY = 17
  const frameColor = '#222'
  const lensColor = 'rgba(30, 30, 50, 0.7)'

  // Left lens
  ctx.fillStyle = frameColor
  ctx.fillRect(cx - 7, eyeY - 2, 6, 5)
  ctx.fillStyle = lensColor
  ctx.fillRect(cx - 6.5, eyeY - 1.5, 5, 4)
  // Right lens
  ctx.fillStyle = frameColor
  ctx.fillRect(cx + 1, eyeY - 2, 6, 5)
  ctx.fillStyle = lensColor
  ctx.fillRect(cx + 1.5, eyeY - 1.5, 5, 4)
  // Bridge
  ctx.fillStyle = frameColor
  ctx.fillRect(cx - 1, eyeY - 1, 2, 2)
  // Arms
  ctx.strokeStyle = frameColor
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(cx - 7, eyeY)
  ctx.lineTo(cx - 9, eyeY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 7, eyeY)
  ctx.lineTo(cx + 9, eyeY)
  ctx.stroke()
}

function drawEarmuffs(ctx, palette, state, time) {
  const cx = 16
  const cy = 16

  // Band across top
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, 14, Math.PI * 0.85, Math.PI * 0.15, false)
  ctx.stroke()

  // Left muff
  ctx.fillStyle = '#e57373'
  ctx.beginPath()
  ctx.ellipse(cx - 14, cy, 3, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ef5350'
  ctx.lineWidth = 0.8
  ctx.stroke()
  // Right muff
  ctx.beginPath()
  ctx.ellipse(cx + 14, cy, 3, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

accessories.set('partyhat', { key: 'partyhat', name: 'Party Hat', draw: drawPartyHat })
accessories.set('bowtie', { key: 'bowtie', name: 'Bowtie', draw: drawBowtie })
accessories.set('sunglasses', { key: 'sunglasses', name: 'Sunglasses', draw: drawSunglasses })
accessories.set('earmuffs', { key: 'earmuffs', name: 'Earmuffs', draw: drawEarmuffs })
```

- [ ] **Step 2: Verify module loads**

Run `cd bento && npx vite`, open console:
```js
import('./src/accessories.js').then(m => {
  console.log('Accessories loaded:', m.accessories.size)
  m.accessories.forEach((a, k) => console.log(' -', k, a.name))
})
```

Expected: 4 accessories listed (partyhat, bowtie, sunglasses, earmuffs).

- [ ] **Step 3: Commit**

```bash
git add bento/src/accessories.js
git commit -m "feat: add accessory definitions (party hat, bowtie, sunglasses, earmuffs)"
```

---

### Task 2: Add drawAccessory to Skin Interface

**Files:**
- Modify: `bento/src/skins/default.js`

**Interfaces:**
- Produces: `drawAccessory(ctx, palette, state, time)` method on defaultSkin

- [ ] **Step 1: Add drawAccessory method to defaultSkin**

Add after the existing `drawAntenna` method (before the closing `}`):

```js
  drawAccessory(ctx, palette, state, time) {
    if (!state.accessory) return

    const { accessories } = await import('../accessories.js')
    const acc = accessories.get(state.accessory)
    if (acc) {
      acc.draw(ctx, palette, state, time)
    }
  }
```

Wait — `await import` in a synchronous method called every frame will cause issues. Let me use a top-level import instead.

- [ ] **Step 1 (revised): Add accessory import and drawAccessory to defaultSkin**

Add at the top of `bento/src/skins/default.js`:
```js
import { accessories } from '../accessories.js'
```

Add after `drawAntenna`:
```js
  drawAccessory(ctx, palette, state, time) {
    if (!state.accessory) return
    const acc = accessories.get(state.accessory)
    if (acc) {
      acc.draw(ctx, palette, state, time)
    }
  }
```

- [ ] **Step 2: Verify skin loads with import**

Run `cd bento && npx vite`, check browser console for any import errors. The page should load normally.

- [ ] **Step 3: Commit**

```bash
git add bento/src/skins/default.js
git commit -m "feat: add drawAccessory method to default skin"
```

---

### Task 3: Add Accessory State Machine to Bento

**Files:**
- Modify: `bento/src/bento.js`

**Interfaces:**
- Consumes: `accessories` Map (from accessories.js, imported through skin dispatch)
- Produces: `this._accessory` state, accessory tracking in `_update()`, `drawAccessory()` call in `_draw()`, accessory info in state object

- [ ] **Step 1: Add accessory state to constructor**

After `this._dizzyDuration = 2.0` (line 53), add:
```js
    // Accessory state
    this._accessory = null
    this._accessoryTimer = 0
    this._accessoryDuration = 120 + Math.random() * 60
    this._accessoryCheckTimer = 10 + Math.random() * 15
```

- [ ] **Step 2: Add accessory update logic to _update()**

After the random events block (after line 167), add:
```js
    // Accessory random events (very rare)
    if (this.mood === 'idle' && !this._event && !this._accessory) {
      this._accessoryCheckTimer -= dt
      if (this._accessoryCheckTimer <= 0) {
        if (Math.random() < 0.05) {
          const keys = Array.from(accessories.keys())
          this._setAccessory(keys[Math.floor(Math.random() * keys.length)])
        }
        this._accessoryCheckTimer = 10 + Math.random() * 15
      }
    }

    // Update accessory timer
    if (this._accessory) {
      this._accessoryTimer -= dt
      if (this._accessoryTimer <= 0) {
        this._accessory = null
        this._accessoryTimer = 0
      }
    }
```

Need to import accessories at the top. Add:
```js
import { accessories } from './accessories.js'
```

- [ ] **Step 3: Add _setAccessory helper method**

Add after `triggerDizzy()` (after line 337):
```js
  _setAccessory(key) {
    this._accessory = key
    this._accessoryTimer = 120 + Math.random() * 60
  }
```

- [ ] **Step 4: Add accessory info to state object in _draw()**

In the state object (around line 378), add after `time: this._time`:
```js
      accessory: this._accessory,
```

- [ ] **Step 5: Add drawAccessory call in _draw()**

After `this.skin.drawEyes(ctx, ...)` (line 394), add:
```js
    this.skin.drawAccessory(ctx, this.skin.palette, state, this._time)
```

- [ ] **Step 6: Verify**

Run `cd bento && npx vite`. Wait for 10-15 seconds of idle — an accessory should eventually appear with ~5% chance per check. It should stay for 2-3 minutes then disappear.

- [ ] **Step 7: Commit**

```bash
git add bento/src/bento.js
git commit -m "feat: add accessory state machine to Bento"
```

---

### Task 4: Birthday Auto-Apply Party Hat

**Files:**
- Modify: `bento/src/bento.js`
- Modify: `bento/src/main.js`

**Interfaces:**
- Consumes: `SettingsStore` (from main.js)
- Produces: party hat auto-applied on birthday

- [ ] **Step 1: Add birthday check method to Bento**

Add after `_setAccessory`:
```js
  _checkBirthday(settings) {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const birthMonth = parseInt(settings.get('birthMonth'), 10)
    const birthDay = parseInt(settings.get('birthDay'), 10)
    if (birthMonth === month && birthDay === day) {
      this._setAccessory('partyhat')
    }
  }
```

- [ ] **Step 2: Expose birthday check from main.js**

In `bento/src/main.js`, after Bento is created and started, add:
```js
  bento._checkBirthday(settings)
```

- [ ] **Step 3: Add birthday import to main.js**

Already imported via `SettingsStore` in Phase 1 — no change needed.

- [ ] **Step 4: Verify**

Set birthday to today in settings, refresh. Party hat should appear immediately. Set birthday to a different date, refresh — no hat.

- [ ] **Step 5: Commit**

```bash
git add bento/src/bento.js bento/src/main.js
git commit -m "feat: auto-apply party hat on birthday from settings"
```