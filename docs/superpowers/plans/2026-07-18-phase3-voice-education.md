# Phase 3: Voice & Education — TTS, Letter Display, AI Voice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Bento a voice — pre-recorded audio for letters/numbers/phonetics with AI voice fallback — and an educational mode where Bento displays and says letters and numbers.

**Architecture:** An `AudioManager` class handles loading and playing pre-recorded audio files, with an AI voice fallback via the configured API. A `LetterDisplay` module renders large letters/numbers on the canvas. Bento gains an educational mode where tapping cycles through letters/numbers. The `SettingsStore` provides the API key for AI voice fallback.

**Tech Stack:** Vanilla JS, Web Audio API (for playback), Canvas API, Fetch API (for AI voice API calls)

## Global Constraints

- Zero external dependencies
- Pre-recorded audio files stored in `bento/public/audio/` directory
- Audio files named by content: `a.mp3`, `b.mp3`, `1.mp3`, `a-phonetic.mp3`, etc.
- AI voice fallback calls configured API endpoint with `POST /v1/audio/speech` (OpenAI-compatible)
- All audio errors silently caught (matching existing SoundEngine pattern)
- Letter display: large centered text below Bento's head area
- Educational mode toggle: button in the settings page or a tap pattern

---

### Task 1: Create AudioManager

**Files:**
- Create: `bento/src/audio.js`

**Interfaces:**
- Produces: `class AudioManager` with `constructor()`, `.play(key)`, `.setApiConfig(endpoint, key)`, `.preload(keys)`, `.destroy()`

- [ ] **Step 1: Create src/audio.js**

```js
export class AudioManager {
  constructor() {
    this._cache = new Map()
    this._apiEndpoint = ''
    this._apiKey = ''
    this._audioCtx = null
  }

  _ensureContext() {
    if (!this._audioCtx) {
      try {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        // Audio not available
      }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().catch(() => {})
    }
  }

  setApiConfig(endpoint, key) {
    this._apiEndpoint = endpoint
    this._apiKey = key
  }

  async preload(keys) {
    for (const key of keys) {
      if (this._cache.has(key)) continue
      try {
        const resp = await fetch(`/audio/${key}.mp3`)
        if (resp.ok) {
          const blob = await resp.blob()
          this._cache.set(key, { type: 'file', blob })
        }
      } catch {
        // File not found — will use AI fallback
      }
    }
  }

  async play(key) {
    // Try cached audio first
    const entry = this._cache.get(key)
    if (entry && entry.type === 'file') {
      this._playBuffer(entry.blob)
      return
    }

    // Try AI fallback
    if (this._apiEndpoint && this._apiKey) {
      await this._playAIVoice(key)
    }
  }

  async _playBuffer(blob) {
    this._ensureContext()
    if (!this._audioCtx) return

    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await this._audioCtx.decodeAudioData(arrayBuffer)
      const source = this._audioCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this._audioCtx.destination)
      source.start()
    } catch {
      // Decode or playback failed — silently ignore
    }
  }

  async _playAIVoice(text) {
    this._ensureContext()
    if (!this._audioCtx) return

    try {
      const resp = await fetch(`${this._apiEndpoint}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._apiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        })
      })

      if (!resp.ok) return

      const blob = await resp.blob()
      this._cache.set(text, { type: 'file', blob })
      await this._playBuffer(blob)
    } catch {
      // AI voice failed — silently ignore
    }
  }

  destroy() {
    this._cache.clear()
    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {})
      this._audioCtx = null
    }
  }
}
```

- [ ] **Step 2: Verify module loads**

Run `cd bento && npx vite`, open console:
```js
import('./src/audio.js').then(m => {
  console.log('AudioManager loaded:', typeof m.AudioManager)
})
```

Expected: `AudioManager loaded: function`

- [ ] **Step 3: Create audio directory placeholder**

```bash
mkdir -p bento/public/audio
touch bento/public/audio/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add bento/src/audio.js bento/public/audio/.gitkeep
git commit -m "feat: add AudioManager with file playback and AI voice fallback"
```

---

### Task 2: Add Letter Display to Canvas

**Files:**
- Modify: `bento/src/bento.js`
- Modify: `bento/src/skins/default.js`

**Interfaces:**
- Consumes: `Bento` state machine
- Produces: large letter/number rendered on canvas below Bento's head

- [ ] **Step 1: Add letter display state to Bento**

Add to constructor after accessory state:
```js
    // Letter display
    this._displayLetter = null
    this._displayLetterTimer = 0
```

- [ ] **Step 2: Add letter display methods**

Add after `_checkBirthday`:
```js
  showLetter(letter) {
    this._displayLetter = letter
    this._displayLetterTimer = 3
  }

  _updateLetterDisplay(dt) {
    if (this._displayLetter) {
      this._displayLetterTimer -= dt
      if (this._displayLetterTimer <= 0) {
        this._displayLetter = null
      }
    }
  }
```

- [ ] **Step 3: Add letter update call to _update()**

At the end of `_update()` (after the particle update loop, before the closing brace of the method), add:
```js
    this._updateLetterDisplay(dt)
```

- [ ] **Step 4: Add letter info to state object**

In the state object in `_draw()`, add after `accessory`:
```js
      displayLetter: this._displayLetter,
```

- [ ] **Step 5: Add letter rendering to drawHead**

In `bento/src/skins/default.js`, in `drawHead`, after the visor rendering (after the `ctx.fill()` for the visor), add:
```js
    // Letter display
    if (state && state.displayLetter) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.globalAlpha = Math.min(1, state.displayLetterTimer || 1)
      ctx.fillText(state.displayLetter, cx, cy + 13)
      ctx.globalAlpha = 1
    }
```

Wait, `state.displayLetterTimer` isn't passed through. Let me add it to the state object.

- [ ] **Step 5 (revised): Add displayLetterTimer to state**

In bento.js state object:
```js
      displayLetter: this._displayLetter,
      displayLetterTimer: this._displayLetterTimer,
```

In default.js drawHead:
```js
    if (state && state.displayLetter) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.globalAlpha = Math.min(1, state.displayLetterTimer || 1)
      ctx.fillText(state.displayLetter, cx, cy + 13)
      ctx.globalAlpha = 1
    }
```

- [ ] **Step 6: Verify**

Run `cd bento && npx vite`, open console:
```js
window.__bento.showLetter('A')
```

Expected: Large letter 'A' appears below Bento's head for 3 seconds, then fades out.

- [ ] **Step 7: Commit**

```bash
git add bento/src/bento.js bento/src/skins/default.js
git commit -m "feat: add letter display to canvas with showLetter()"
```

---

### Task 3: Add Educational Mode

**Files:**
- Modify: `bento/src/bento.js`
- Modify: `bento/src/main.js`
- Modify: `bento/src/settings.js`

**Interfaces:**
- Consumes: `AudioManager`, `SettingsStore`
- Produces: educational mode toggle and letter cycling

- [ ] **Step 1: Add educational mode state to Bento**

Add to constructor:
```js
    // Educational mode
    this._educationalMode = false
    this._letterIndex = 0
    this._letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
```

- [ ] **Step 2: Add audio manager reference**

Add to constructor parameters (optional, set via setter):
```js
    this._audio = null
```

Add setter:
```js
  setAudioManager(audio) {
    this._audio = audio
  }
```

- [ ] **Step 3: Add educational mode toggle**

```js
  setEducationalMode(enabled) {
    this._educationalMode = enabled
    this._letterIndex = 0
  }
```

- [ ] **Step 4: Override tap behavior for educational mode**

Modify `_handleTap` — at the top, after the sleep check, add:
```js
    if (this._educationalMode) {
      this._handleEducationalTap()
      return
    }
```

- [ ] **Step 5: Add _handleEducationalTap**

```js
  _handleEducationalTap() {
    const letter = this._letters[this._letterIndex]
    this.showLetter(letter)
    if (this._audio) {
      this._audio.play(letter.toLowerCase())
    }
    this._letterIndex = (this._letterIndex + 1) % this._letters.length
  }
```

- [ ] **Step 6: Wire educational mode in main.js**

In `bento/src/main.js`, after creating Bento, add:
```js
  const audio = new AudioManager()
  bento.setAudioManager(audio)

  // Preload common audio files
  audio.preload('abcdefghijklmnopqrstuvwxyz0123456789'.split('').map(c => c.toLowerCase()))

  // Load API config for AI fallback
  const apiEndpoint = settings.get('apiEndpoint')
  const apiKey = settings.get('apiKey')
  if (apiEndpoint && apiKey) {
    audio.setApiConfig(apiEndpoint, apiKey)
  }
```

Import `AudioManager` at the top:
```js
import { AudioManager } from './audio.js'
```

- [ ] **Step 7: Add educational mode toggle to settings page**

In `bento/index.html`, add to the settings form (before the save button):
```html
        <label>
          <input type="checkbox" name="educationalMode">
          Educational Mode (tap cycles through letters)
        </label>
```

In `bento/src/style.css`, add:
```css
#settings-form input[type="checkbox"] {
  display: inline-block;
  width: auto;
  margin-top: 0;
  margin-right: 8px;
  accent-color: #4fc3f7;
}

#settings-form label:has(input[type="checkbox"]) {
  display: flex;
  align-items: center;
  flex-direction: row;
}
```

In `bento/src/main.js`, in the settings save handler, after saving, add:
```js
    bento.setEducationalMode(!!settings.get('educationalMode'))
```

And in the settings load handler, apply the mode:
```js
    bento.setEducationalMode(!!data.educationalMode)
```

- [ ] **Step 8: Verify**

Open settings, enable Educational Mode, save. Tap Bento — it should cycle through letters A-Z, 0-9, displaying each on screen. Audio should play if files exist or AI fallback is configured.

- [ ] **Step 9: Commit**

```bash
git add bento/src/bento.js bento/src/main.js bento/index.html bento/src/style.css
git commit -m "feat: add educational mode with letter cycling and audio"
```