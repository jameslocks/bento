# Bento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable single-page web app featuring Bento, a cute pixel-art robot head with animated eyes, synthesized sounds, and tap interaction.

**Architecture:** Vite + vanilla JS project. A `Bento` class manages a Canvas rendering loop and state machine (`idle`/`happy`). A `SoundEngine` class synthesizes sounds via Web Audio API oscillators. Skins are modular JS objects with palette + draw functions. GitHub Actions deploys to GitHub Pages.

**Tech Stack:** Vite, Canvas API, Web Audio API, GitHub Actions

## Global Constraints

- Zero external dependencies
- All sounds synthesized via Web Audio API — no audio files
- Pixel art rendered on Canvas at 32x32 logical grid, scaled up
- Must work on mobile (touch events alongside click)
- AudioContext created lazily on first user interaction (browser autoplay policy)
- All audio errors silently caught — never show user-facing audio errors

---

### Task 1: Project Scaffolding

**Files:**
- Create: `bento/package.json`
- Create: `bento/vite.config.js`
- Create: `bento/index.html`
- Create: `bento/src/style.css`
- Create: `bento/public/favicon.svg`

**Interfaces:**
- Consumes: nothing
- Produces: bootable Vite dev server at `http://localhost:5173`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "bento",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bento/'
})
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bento</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/src/style.css">
</head>
<body>
  <div id="app">
    <canvas id="bento-canvas"></canvas>
    <p id="fallback" class="hidden">Your browser doesn't support Canvas. Bento is sad.</p>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/style.css**

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f0e6d3;
  font-family: system-ui, sans-serif;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

#bento-canvas {
  cursor: pointer;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  touch-action: manipulation;
}

.hidden {
  display: none;
}

#fallback {
  color: #666;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
}
```

- [ ] **Step 5: Create public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="4" y="6" width="24" height="20" rx="4" fill="white" stroke="#ccc" stroke-width="1"/>
  <rect x="8" y="10" width="16" height="12" rx="2" fill="#1a1a2e"/>
  <circle cx="13" cy="16" r="2" fill="#4fc3f7"/>
  <circle cx="19" cy="16" r="2" fill="#4fc3f7"/>
</svg>
```

- [ ] **Step 6: Install dependencies and verify dev server boots**

Run: `cd bento && npm install`
Then: `npx vite --port 5173` (Ctrl+C after confirming it starts)

Expected: Vite dev server starts without errors, `http://localhost:5173` shows blank page with warm beige background.

---

### Task 2: Sound Engine

**Files:**
- Create: `bento/src/sound.js`

**Interfaces:**
- Consumes: nothing
- Produces: `SoundEngine` class with `.chirp()`, `.boop()`, `.happy()` methods, all returning `void`

- [ ] **Step 1: Create src/sound.js**

```js
export class SoundEngine {
  constructor() {
    this._ctx = null
  }

  _ensureContext() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        // Audio not available — sounds will be silent
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {})
    }
  }

  _play(frequency, duration, type = 'sine', volume = 0.15) {
    this._ensureContext()
    if (!this._ctx) return

    const osc = this._ctx.createOscillator()
    const gain = this._ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, this._ctx.currentTime)

    gain.gain.setValueAtTime(volume, this._ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(this._ctx.destination)

    osc.start(this._ctx.currentTime)
    osc.stop(this._ctx.currentTime + duration)
  }

  chirp() {
    this._play(880, 0.1, 'sine')
  }

  boop() {
    this._play(440, 0.15, 'triangle')
  }

  happy() {
    this._ensureContext()
    if (!this._ctx) return

    const now = this._ctx.currentTime
    const notes = [660, 880]
    notes.forEach((freq, i) => {
      const osc = this._ctx.createOscillator()
      const gain = this._ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.1)
      gain.gain.setValueAtTime(0.15, now + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15)
      osc.connect(gain)
      gain.connect(this._ctx.destination)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.15)
    })
  }
}
```

- [ ] **Step 2: Quick smoke test**

Open browser console on the dev server and run:

```js
import('./src/sound.js').then(m => {
  const s = new m.SoundEngine()
  s.chirp()
  setTimeout(() => s.boop(), 300)
  setTimeout(() => s.happy(), 600)
})
```

Expected: Three distinct sounds play — short high chirp, lower boop, ascending two-tone happy.

---

### Task 3: Default Skin

**Files:**
- Create: `bento/src/skins/default.js`
- Create: `bento/src/skins/index.js`

**Interfaces:**
- Produces: `defaultSkin` object with `{ name, palette, drawHead(ctx, palette, time), drawEyes(ctx, palette, state, time), drawAntenna(ctx, palette, time) }`
- `state` parameter: `{ mood: 'idle' | 'happy', blink: boolean, eyeOpen: boolean, blinkTimer: number }`

- [ ] **Step 1: Create src/skins/default.js**

```js
export const defaultSkin = {
  name: 'Default',
  palette: {
    head: '#ffffff',
    visor: '#1a1a2e',
    eye: '#4fc3f7',
    cheek: '#ff8a80',
    antenna: '#aaaaaa',
    glow: '#ffd54f'
  },

  drawHead(ctx, palette, time) {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const cx = w / 2
    const cy = h / 2

    // Head body — rounded rectangle
    const hw = 28
    const hh = 24
    const rx = 4
    const x = cx - hw / 2
    const y = cy - hh / 2

    ctx.fillStyle = palette.head
    ctx.beginPath()
    ctx.moveTo(x + rx, y)
    ctx.lineTo(x + hw - rx, y)
    ctx.quadraticCurveTo(x + hw, y, x + hw, y + rx)
    ctx.lineTo(x + hw, y + hh - rx)
    ctx.quadraticCurveTo(x + hw, y + hh, x + hw - rx, y + hh)
    ctx.lineTo(x + rx, y + hh)
    ctx.quadraticCurveTo(x, y + hh, x, y + hh - rx)
    ctx.lineTo(x, y + rx)
    ctx.quadraticCurveTo(x, y, x + rx, y)
    ctx.closePath()
    ctx.fill()

    // Visor
    const vx = cx - 10
    const vy = cy - 6
    const vw = 20
    const vh = 12
    ctx.fillStyle = palette.visor
    ctx.beginPath()
    ctx.roundRect(vx, vy, vw, vh, 2)
    ctx.fill()
  },

  drawEyes(ctx, palette, state, time) {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const cx = w / 2
    const cy = h / 2
    const eyeY = cy + 1

    if (state.mood === 'happy') {
      // Happy eyes — larger circles
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      // Blush cheeks
      ctx.fillStyle = palette.cheek
      ctx.beginPath()
      ctx.arc(cx - 7, eyeY + 3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 7, eyeY + 3, 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (state.blink) {
      // Blinking — closed eyes (horizontal lines)
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx - 5.5, eyeY)
      ctx.lineTo(cx - 2.5, eyeY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 2.5, eyeY)
      ctx.lineTo(cx + 5.5, eyeY)
      ctx.stroke()
    } else {
      // Normal eyes — small dots
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  },

  drawAntenna(ctx, palette, time) {
    const w = ctx.canvas.width
    const cx = w / 2
    const topY = 4

    // Antenna stem
    ctx.strokeStyle = palette.antenna
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, topY + 3)
    ctx.lineTo(cx, topY)
    ctx.stroke()

    // Glowing dot
    const glow = Math.sin(time * 3) * 0.3 + 0.7
    ctx.fillStyle = palette.glow
    ctx.globalAlpha = glow
    ctx.beginPath()
    ctx.arc(cx, topY, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}
```

- [ ] **Step 2: Create src/skins/index.js**

```js
import { defaultSkin } from './default.js'

const registry = new Map()
registry.set('default', defaultSkin)

export function getSkin(name) {
  return registry.get(name) || defaultSkin
}

export function getSkinNames() {
  return Array.from(registry.keys())
}

export function registerSkin(name, skin) {
  registry.set(name, skin)
}
```

- [ ] **Step 3: Verify skin module loads without errors**

Run: `cd bento && node -e "import('./src/skins/default.js').then(m => console.log('OK:', m.defaultSkin.name)).catch(e => console.error(e))"`
or skip if Node ESM flags are tricky — just check it imports cleanly in browser devtools.

---

### Task 4: Bento Engine

**Files:**
- Create: `bento/src/bento.js`

**Interfaces:**
- Consumes: `SoundEngine` class (from Task 2), skin object (from Task 3)
- Produces: `Bento` class with `constructor(canvas, skin, sound)`, `.start()`, `.destroy()`

- [ ] **Step 1: Create src/bento.js**

```js
export class Bento {
  constructor(canvas, skin, sound) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.skin = skin
    this.sound = sound

    this._gridSize = 32
    this._scale = 1
    this._resize()

    this._rafId = null
    this._lastTime = 0
    this._time = 0

    // State machine
    this.mood = 'idle'
    this._happyTimer = 0
    this._happyCooldown = 0

    // Idle animation state
    this._blinkTimer = 3 + Math.random() * 2
    this._isBlinking = false
    this._blinkDuration = 0.1
    this._chirpTimer = 8 + Math.random() * 7

    // Tap handler
    this._onTap = this._handleTap.bind(this)
    this.canvas.addEventListener('click', this._onTap)
    this.canvas.addEventListener('touchstart', this._onTap, { passive: true })
  }

  _resize() {
    const displaySize = Math.min(window.innerWidth, window.innerHeight) * 0.6
    this._scale = Math.max(4, Math.floor(displaySize / this._gridSize))
    const size = this._gridSize * this._scale
    this.canvas.width = size
    this.canvas.height = size
    this.canvas.style.width = size + 'px'
    this.canvas.style.height = size + 'px'
  }

  start() {
    this._lastTime = performance.now()
    this._loop(this._lastTime)
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this.canvas.removeEventListener('click', this._onTap)
    this.canvas.removeEventListener('touchstart', this._onTap)
  }

  _loop(timestamp) {
    const dt = (timestamp - this._lastTime) / 1000
    this._lastTime = timestamp
    this._time += dt

    this._update(dt)
    this._draw()

    this._rafId = requestAnimationFrame((t) => this._loop(t))
  }

  _update(dt) {
    // Happy state timer
    if (this.mood === 'happy') {
      this._happyTimer -= dt
      if (this._happyTimer <= 0) {
        this.mood = 'idle'
      }
    }
    if (this._happyCooldown > 0) {
      this._happyCooldown -= dt
    }

    // Blink timer
    this._blinkTimer -= dt
    if (this._blinkTimer <= 0) {
      this._isBlinking = true
      this._blinkTimer = 3 + Math.random() * 2
    }
    if (this._isBlinking) {
      this._blinkDuration -= dt
      if (this._blinkDuration <= 0) {
        this._isBlinking = false
        this._blinkDuration = 0.1
      }
    }

    // Autonomous chirp
    this._chirpTimer -= dt
    if (this._chirpTimer <= 0) {
      this.sound.chirp()
      this._chirpTimer = 8 + Math.random() * 7
    }
  }

  _handleTap(e) {
    e.preventDefault()
    if (this._happyCooldown > 0) return

    this.mood = 'happy'
    this._happyTimer = 1.5
    this._happyCooldown = 1.5
    this.sound.happy()
  }

  _draw() {
    const ctx = this.ctx
    const size = this._gridSize * this._scale

    ctx.fillStyle = '#f0e6d3'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    ctx.save()
    ctx.translate(0, this._getBounceOffset())

    ctx.scale(this._scale, this._scale)

    const state = {
      mood: this.mood,
      blink: this._isBlinking,
      time: this._time
    }

    this.skin.drawAntenna(ctx, this.skin.palette, this._time)
    this.skin.drawHead(ctx, this.skin.palette, this._time)
    this.skin.drawEyes(ctx, this.skin.palette, state, this._time)

    ctx.restore()
  }

  _getBounceOffset() {
    if (this.mood === 'happy') {
      // Quick upward bounce that settles
      const t = this._happyTimer
      if (t > 1.2) {
        // Initial jump
        const phase = (t - 1.2) / 0.3
        return -Math.sin(phase * Math.PI) * 6 * this._scale
      }
      // Settling bounce
      return -Math.sin(t * 8) * 1.5 * Math.max(0, t / 1.2) * this._scale
    }
    // Idle gentle float
    return Math.sin(this._time * 1.5) * 1.5 * this._scale
  }

  setSkin(skin) {
    this.skin = skin
  }
}
```

- [ ] **Step 2: Quick render test**

Open browser console and run:
```js
import('./src/bento.js').then(m => {
  const c = document.createElement('canvas')
  document.body.appendChild(c)
  // This is just to check the class loads — full test comes in Task 5
  console.log('Bento class loaded:', typeof m.Bento)
})
```

Expected: `Bento class loaded: function` logged to console.

---

### Task 5: Main Entry Point

**Files:**
- Create: `bento/src/main.js`

**Interfaces:**
- Consumes: `Bento` (Task 4), `SoundEngine` (Task 2), `defaultSkin` (Task 3)
- Produces: running Bento instance on the page

- [ ] **Step 1: Create src/main.js**

```js
import { Bento } from './bento.js'
import { SoundEngine } from './sound.js'
import { defaultSkin } from './skins/default.js'
import { getSkin } from './skins/index.js'

function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  // Expose for debugging
  window.__bento = bento
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
```

- [ ] **Step 2: Run dev server and verify**

Run: `cd bento && npx vite`
Open `http://localhost:5173`

Expected: Bento appears centered on a warm beige background. White head with dark visor, glowing antenna, two blue dot eyes. The whole thing gently bounces. Click/tap Bento — eyes widen, cheeks appear, happy sound plays, bigger bounce.

- [ ] **Step 3: Show fallback when Canvas unavailable**

Open browser console and test:
```js
document.getElementById('bento-canvas').getContext = null
// Reload logic would show fallback; for now verify the fallback element exists in HTML
console.log(document.getElementById('fallback'))
```

Expected: Fallback element exists in DOM.

---

### Task 6: GitHub Actions Deployment

**Files:**
- Create: `bento/.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the Vite project from Task 1
- Produces: auto-deployment to GitHub Pages on push to main

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./bento
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: ./bento/package-lock.json
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./bento/dist
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify build works**

Run: `cd bento && npm run build`
Expected: `dist/` directory created with `index.html`, assets, etc. No errors.

- [ ] **Step 3: Preview production build**

Run: `cd bento && npx vite preview`
Open `http://localhost:4173` — Bento should look identical to dev mode.

---

### Task 7: Polish — Edge Cases & Skin Selector

**Files:**
- Modify: `bento/src/main.js`
- Modify: `bento/index.html`
- Modify: `bento/src/style.css`

- [ ] **Step 1: Window resize handling in main.js**

Update `src/main.js` to call `bento._resize()` on window resize:

```js
function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  window.addEventListener('resize', () => bento._resize())

  // Expose for debugging
  window.__bento = bento
}
```

- [ ] **Step 2: Add skin selector UI to index.html**

```html
<div id="app">
  <canvas id="bento-canvas"></canvas>
  <p id="fallback" class="hidden">Your browser doesn't support Canvas. Bento is sad.</p>
  <div id="skin-selector">
    <button data-skin="default" class="skin-btn active">Default</button>
  </div>
</div>
```

- [ ] **Step 3: Style the skin selector**

Add to `src/style.css`:

```css
#skin-selector {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.skin-btn {
  padding: 6px 14px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.skin-btn:hover {
  border-color: #4fc3f7;
}

.skin-btn.active {
  border-color: #4fc3f7;
  background: #e1f5fe;
}
```

- [ ] **Step 4: Wire skin selector in main.js**

```js
function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')
  const skinButtons = document.querySelectorAll('.skin-btn')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  window.addEventListener('resize', () => bento._resize())

  skinButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      skinButtons.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const skin = getSkin(btn.dataset.skin)
      bento.setSkin(skin)
      sound.boop()
    })
  })

  window.__bento = bento
}
```

- [ ] **Step 5: Verify everything works**

Run: `cd bento && npx vite`
Verify:
- Bento appears and animates
- Tap/click triggers happy state
- Window resize updates canvas size
- Skin selector buttons work (only "Default" for now, but system is in place)
- Build succeeds: `npm run build`

Expected: All behaviors working, production build clean.
