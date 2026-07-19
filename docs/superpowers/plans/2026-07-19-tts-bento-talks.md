# Bento Talks Back (TTS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add text-to-speech via OpenRouter audio/speech endpoint. Extend AudioManager with `speak()` method. Add voice settings fields.

**Architecture:** New method on AudioManager. Settings overlay gets 3 new fields. No new files.

**Tech Stack:** Vanilla JS, Web Audio API, OpenRouter TTS API

## Global Constraints

- Zero external dependencies
- Default model: `openai/gpt-4o-mini-tts-2025-12-15`
- Default voice: `alloy`
- Speed range: 0.5-2.0, default 1.0
- API endpoint and key already exist in settings from previous phases

---

### Task 1: Add speak() to AudioManager

**Files:**
- Modify: `bento/src/audio.js`

- [ ] **Step 1: Add speak() method**

After `_playAIVoice()` method, add:

```js
  async speak(text, voice, instructions, speed) {
    if (!this._apiEndpoint || !this._apiKey) return
    this._ensureContext()
    if (!this._ctx) return

    const model = voice || 'openai/gpt-4o-mini-tts-2025-12-15'
    const spd = speed || 1.0
    const body = { model, input: text, voice: 'alloy', response_format: 'mp3', speed: Math.max(0.5, Math.min(2.0, spd)) }
    if (instructions) {
      body.provider = { options: { openai: { instructions } } }
    }

    try {
      const resp = await fetch(`${this._apiEndpoint}/audio/speech`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this._apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!resp.ok) return
      const blob = await resp.blob()
      await this._playBuffer(blob)
    } catch {}
  }
```

- [ ] **Step 2: Verify build**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add bento/src/audio.js
git commit -m "feat: add speak() method to AudioManager for TTS"
```

---

### Task 2: Add Voice Settings Fields

**Files:**
- Modify: `bento/index.html`
- Modify: `bento/src/style.css`
- Modify: `bento/src/main.js`

- [ ] **Step 1: Add HTML fields**

In `index.html`, before the submit button in the settings form, add:

```html
        <label>
          Voice Model
          <input type="text" name="voiceModel" value="openai/gpt-4o-mini-tts-2025-12-15" autocomplete="off">
        </label>
        <label>
          Voice Speed
          <input type="number" name="voiceSpeed" value="1.0" min="0.5" max="2.0" step="0.1" autocomplete="off">
        </label>
        <label>
          Voice Instructions
          <textarea name="voiceInstructions" rows="2" placeholder="Speak like a friendly robot..." autocomplete="off"></textarea>
        </label>
```

- [ ] **Step 2: Add CSS for textarea**

In `style.css`, add:
```css
#settings-form textarea {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #2c2c2c;
  color: #e0e0e0;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
}
#settings-form textarea:focus {
  border-color: #4fc3f7;
}
```

- [ ] **Step 3: Wire voice config in main.js**

After the existing API config block (around line 48-52), add:

```js
  // Voice config
  const voiceModel = settings.get('voiceModel') || 'openai/gpt-4o-mini-tts-2025-12-15'
  const voiceSpeed = parseFloat(settings.get('voiceSpeed')) || 1.0
  const voiceInstructions = settings.get('voiceInstructions') || ''
```

- [ ] **Step 4: Verify build**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```

- [ ] **Step 5: Commit**

```bash
git add bento/index.html bento/src/style.css bento/src/main.js
git commit -m "feat: add voice TTS settings fields (model, speed, instructions)"
```

---

### Task 3: Add Debug Panel TTS Button

**Files:**
- Modify: `bento/src/debug.js`

- [ ] **Step 1: Add speak test button**

Add a new section to the debug panel after the Letter section:

```js
  // TTS
  const ttsInput = el('input', STYLES.input)
  ttsInput.placeholder = 'Hello!'
  ttsInput.style.width = '100px'
  panel.appendChild(section('TTS', row([
    ttsInput,
    btn('Speak', () => {
      if (ttsInput.value && bento._audio && bento._audio.speak) {
        bento._audio.speak(ttsInput.value)
      }
    })
  ])))
```

- [ ] **Step 2: Verify build**

```bash
cd /mnt/d/Projects/bento/bento && npx vite build
```

- [ ] **Step 3: Commit**

```bash
git add bento/src/debug.js
git commit -m "feat: add TTS speak button to debug panel"
```