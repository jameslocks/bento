# Phase 1: Foundation — Settings, UI Cleanup, Tap-Hold

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the UI (remove unused skin selector), add a full-screen settings page with localStorage persistence, and add tap-hold gesture detection.

**Architecture:** Settings are managed by a `SettingsStore` class backed by `localStorage`. A full-screen settings overlay is embedded in `index.html` with its own styles, shown/hidden via a button in the corner. Tap-hold is a new gesture module that fires a callback on 600ms+ press. All three pieces are independent — SettingsStore is a standalone utility, settings UI is a pure HTML/CSS overlay, tap-hold is a standalone gesture detector.

**Tech Stack:** Vanilla JS, localStorage, Canvas API

## Global Constraints

- Zero external dependencies
- All data persisted to localStorage under a `bento:` prefix
- Settings page must be a full-screen overlay (not a separate page/navigation)
- Tap-hold threshold: 600ms
- Must work on mobile (touch events) and desktop (mouse events)
- Backwards compatible — existing Bento behavior unchanged

---

### Task 1: Remove Skin Selector from UI

**Files:**
- Modify: `bento/index.html:14-16`
- Modify: `bento/src/main.js:9,29-37`

**Interfaces:**
- Consumes: nothing
- Produces: clean HTML with no skin selector markup

- [ ] **Step 1: Remove skin selector from index.html**

```html
  <div id="app">
    <canvas id="bento-canvas"></canvas>
    <p id="fallback" class="hidden">Your browser doesn't support Canvas. Bento is sad.</p>
  </div>
```

Delete: the entire `<div id="skin-selector">...</div>` block.

- [ ] **Step 2: Remove skin selector CSS from style.css**

Delete these rules from `bento/src/style.css`:
```css
#skin-selector { ... }
.skin-btn { ... }
.skin-btn:hover { ... }
.skin-btn.active { ... }
```

- [ ] **Step 3: Remove skin selector wiring from main.js**

In `bento/src/main.js`, remove:
```js
const skinButtons = document.querySelectorAll('.skin-btn')
```
and the entire `skinButtons.forEach(...)` block (lines 29-37 in current file).

- [ ] **Step 4: Verify**

Run `cd bento && npx vite` and check that the page loads without errors. The skin selector should be gone, Bento should render and animate normally.

- [ ] **Step 5: Commit**

```bash
git add bento/index.html bento/src/main.js bento/src/style.css
git commit -m "feat: remove skin selector from UI"
```

---

### Task 2: Create SettingsStore

**Files:**
- Create: `bento/src/settings.js`

**Interfaces:**
- Produces: `class SettingsStore` with constructor, `.get(key)`, `.set(key, value)`, `.getAll()`, `.clear()`

- [ ] **Step 1: Create src/settings.js**

```js
const PREFIX = 'bento:'

export class SettingsStore {
  constructor() {
    this._data = this._load()
  }

  _load() {
    try {
      const raw = localStorage.getItem(`${PREFIX}settings`)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  _save() {
    try {
      localStorage.setItem(`${PREFIX}settings`, JSON.stringify(this._data))
    } catch {
      // Storage full or unavailable — silently fail
    }
  }

  get(key) {
    return this._data[key]
  }

  set(key, value) {
    this._data[key] = value
    this._save()
  }

  getAll() {
    return { ...this._data }
  }

  clear() {
    this._data = {}
    this._save()
  }
}
```

- [ ] **Step 2: Quick smoke test**

Open browser console on dev server and run:
```js
import('./src/settings.js').then(m => {
  const s = new m.SettingsStore()
  s.set('name', 'test')
  console.log(s.get('name'))  // 'test'
  console.log(s.getAll())     // { name: 'test' }
  s.clear()
  console.log(s.get('name'))  // undefined
})
```

Expected: All three log statements show the expected values.

- [ ] **Step 3: Commit**

```bash
git add bento/src/settings.js
git commit -m "feat: add SettingsStore with localStorage persistence"
```

---

### Task 3: Build Settings Page UI

**Files:**
- Modify: `bento/index.html`
- Modify: `bento/src/style.css`

**Interfaces:**
- Consumes: none yet (wired to SettingsStore in Task 4)
- Produces: settings overlay HTML with form fields: API Endpoint, API Key, Kid Name, Birthday (month + day)

- [ ] **Step 1: Add settings overlay to index.html**

Replace the current `#app` div with:

```html
  <div id="app">
    <canvas id="bento-canvas"></canvas>
    <p id="fallback" class="hidden">Your browser doesn't support Canvas. Bento is sad.</p>
    <button id="settings-btn" aria-label="Settings">⚙</button>
  </div>

  <div id="settings-overlay" class="hidden">
    <div id="settings-content">
      <div id="settings-header">
        <h2>Settings</h2>
        <button id="settings-close" aria-label="Close settings">✕</button>
      </div>
      <form id="settings-form">
        <label>
          API Endpoint
          <input type="url" name="apiEndpoint" placeholder="https://openrouter.ai/api/v1" autocomplete="off">
        </label>
        <label>
          API Key
          <input type="password" name="apiKey" placeholder="sk-..." autocomplete="off">
        </label>
        <label>
          Kid's Name
          <input type="text" name="kidName" placeholder="Alex" maxlength="20" autocomplete="off">
        </label>
        <fieldset>
          <legend>Birthday</legend>
          <label>
            Month
            <select name="birthMonth">
              <option value="">—</option>
              <option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option>
              <option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option>
              <option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option>
              <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
            </select>
          </label>
          <label>
            Day
            <select name="birthDay">
              <option value="">—</option>
              ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
            </select>
          </label>
        </fieldset>
        <button type="submit" id="settings-save">Save</button>
      </form>
    </div>
  </div>
```

- [ ] **Step 2: Add settings styles to style.css**

```css
#settings-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  z-index: 10;
}

#settings-btn:hover {
  background: rgba(255,255,255,0.3);
  color: #fff;
}

#settings-overlay {
  position: fixed;
  inset: 0;
  background: #1a1a2e;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
}

#settings-overlay.hidden {
  display: none;
}

#settings-content {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  color: #e0e0e0;
}

#settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

#settings-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
}

#settings-close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 4px;
}

#settings-close:hover {
  color: #fff;
}

#settings-form label {
  display: block;
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: #aaa;
}

#settings-form input,
#settings-form select {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #2c2c2c;
  color: #e0e0e0;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

#settings-form input:focus,
#settings-form select:focus {
  border-color: #4fc3f7;
}

#settings-form fieldset {
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

#settings-form legend {
  font-size: 0.85rem;
  color: #aaa;
  padding: 0 6px;
}

#settings-form fieldset label {
  display: inline-block;
  margin-right: 12px;
  margin-bottom: 0;
}

#settings-form fieldset select {
  width: auto;
  min-width: 80px;
}

#settings-save {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #4fc3f7;
  color: #1a1a2e;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

#settings-save:hover {
  background: #29b6f6;
}
```

- [ ] **Step 3: Verify overlay renders**

Run `cd bento && npx vite`, open the page. Verify the gear icon appears in the top-right corner. Clicking it should show the settings overlay. The close button should hide it. Form fields should render without errors.

- [ ] **Step 4: Commit**

```bash
git add bento/index.html bento/src/style.css
git commit -m "feat: add settings overlay UI with form fields"
```

---

### Task 4: Wire Settings to SettingsStore and Bento

**Files:**
- Modify: `bento/src/main.js`

**Interfaces:**
- Consumes: `SettingsStore` (Task 2)
- Produces: settings form loads/saves from localStorage

- [ ] **Step 1: Wire settings in main.js**

Replace the `init()` function body to import SettingsStore, load/save settings:

```js
import { Bento } from './bento.js'
import { ShakeDetector } from './shake.js'
import { SoundEngine } from './sound.js'
import { SettingsStore } from './settings.js'
import { defaultSkin } from './skins/default.js'
import { getSkin } from './skins/index.js'

function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')
  const settingsBtn = document.getElementById('settings-btn')
  const settingsOverlay = document.getElementById('settings-overlay')
  const settingsClose = document.getElementById('settings-close')
  const settingsForm = document.getElementById('settings-form')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  const shake = new ShakeDetector(() => bento.triggerDizzy())

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => bento.resize(), 100)
  })

  // Settings
  const settings = new SettingsStore()

  settingsBtn.addEventListener('click', () => {
    const data = settings.getAll()
    for (const [key, value] of Object.entries(data)) {
      const input = settingsForm.elements[key]
      if (input) input.value = value
    }
    settingsOverlay.classList.remove('hidden')
  })

  settingsClose.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden')
  })

  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.add('hidden')
    }
  })

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(settingsForm)
    for (const [key, value] of formData.entries()) {
      if (value) settings.set(key, value)
    }
    settingsOverlay.classList.add('hidden')
  })

  window.__bento = bento
}
```

- [ ] **Step 2: Verify settings persistence**

Open the page, click gear icon, fill in some values, save. Refresh the page, open settings — values should be pre-filled. Close with ✕ and click outside overlay — both should work.

- [ ] **Step 3: Commit**

```bash
git add bento/src/main.js
git commit -m "feat: wire settings overlay to SettingsStore with load/save"
```

---

### Task 5: Add Tap-Hold Gesture Detection

**Files:**
- Create: `bento/src/taphold.js`

**Interfaces:**
- Produces: `TapHoldDetector` class with `constructor(element, callback, [threshold])` and `.destroy()`

- [ ] **Step 1: Create src/taphold.js**

```js
export class TapHoldDetector {
  constructor(element, callback, threshold = 600) {
    this._element = element
    this._callback = callback
    this._threshold = threshold
    this._timer = null
    this._fired = false

    this._onPointerDown = this._onPointerDown.bind(this)
    this._onPointerUp = this._onPointerUp.bind(this)
    this._onPointerLeave = this._onPointerLeave.bind(this)

    element.addEventListener('pointerdown', this._onPointerDown)
    element.addEventListener('pointerup', this._onPointerUp)
    element.addEventListener('pointerleave', this._onPointerLeave)
  }

  _onPointerDown(e) {
    this._fired = false
    this._timer = setTimeout(() => {
      this._fired = true
      this._callback(e)
    }, this._threshold)
  }

  _onPointerUp(e) {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  _onPointerLeave() {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  destroy() {
    this._element.removeEventListener('pointerdown', this._onPointerDown)
    this._element.removeEventListener('pointerup', this._onPointerUp)
    this._element.removeEventListener('pointerleave', this._onPointerLeave)
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }
}
```

- [ ] **Step 2: Verify module loads**

Run `cd bento && npx vite`, open console:
```js
import('./src/taphold.js').then(m => {
  console.log('TapHoldDetector loaded:', typeof m.TapHoldDetector)
})
```

Expected: `TapHoldDetector loaded: function`

- [ ] **Step 3: Commit**

```bash
git add bento/src/taphold.js
git commit -m "feat: add TapHoldDetector gesture class"
```