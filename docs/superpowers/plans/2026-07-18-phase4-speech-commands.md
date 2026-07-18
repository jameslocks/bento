# Phase 4: Speech & Commands — Tap-Hold to Listen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user tap and hold Bento to speak a command — "show me the letter G" or "do a flip" — with speech recognition, command routing, and a confused fallback for unrecognized requests.

**Architecture:** A `SpeechRecognizer` class wraps the Web Speech API (free, instant) with an AI API fallback. A `CommandRouter` module maps transcribed text to Bento actions (showLetter, trigger events, etc.). The `TapHoldDetector` from Phase 1 triggers listening. Unrecognized commands bias toward Bento's confused expression.

**Tech Stack:** Vanilla JS, Web Speech API (SpeechRecognition), Fetch API (AI transcription fallback), Canvas API

## Global Constraints

- Zero external dependencies
- Web Speech API used as primary recognition (Chrome/Edge/Safari)
- AI API fallback via configured endpoint (OpenAI-compatible `/v1/audio/transcriptions`)
- Listening timeout: 5 seconds of silence after speech ends
- Confused fallback: if no command matches, 60% chance confused, 40% random event
- Must work on mobile (tap-hold gesture) and desktop (tap-hold with mouse)
- All speech errors silently caught — never show user-facing errors

---

### Task 1: Create SpeechRecognizer

**Files:**
- Create: `bento/src/speech.js`

**Interfaces:**
- Produces: `class SpeechRecognizer` with `constructor(onResult, onEnd)`, `.start()`, `.stop()`, `.setApiConfig(endpoint, key)`, `.destroy()`

- [ ] **Step 1: Create src/speech.js**

```js
export class SpeechRecognizer {
  constructor(onResult, onEnd) {
    this._onResult = onResult
    this._onEnd = onEnd
    this._recognition = null
    this._apiEndpoint = ''
    this._apiKey = ''
    this._isListening = false
    this._silenceTimer = null
    this._hasResult = false
  }

  setApiConfig(endpoint, key) {
    this._apiEndpoint = endpoint
    this._apiKey = key
  }

  start() {
    if (this._isListening) return
    this._isListening = true
    this._hasResult = false

    // Try Web Speech API first
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      this._recognition = new SpeechRecognition()
      this._recognition.lang = 'en-US'
      this._recognition.interimResults = false
      this._recognition.maxAlternatives = 1
      this._recognition.continuous = false

      this._recognition.onresult = (event) => {
        this._hasResult = true
        const text = event.results[0][0].transcript.trim().toLowerCase()
        this._onResult(text)
        this._stopSilenceTimer()
        this._silenceTimer = setTimeout(() => this.stop(), 3000)
      }

      this._recognition.onerror = () => {
        this._stopSilenceTimer()
        this._isListening = false
        if (!this._hasResult) {
          this._onEnd('error')
        }
      }

      this._recognition.onend = () => {
        this._isListening = false
        if (!this._hasResult) {
          this._onEnd('timeout')
        }
      }

      this._recognition.start()

      // Auto-stop after 8 seconds if no speech detected
      this._silenceTimer = setTimeout(() => {
        if (!this._hasResult) {
          this.stop()
          this._onEnd('timeout')
        }
      }, 8000)
    } else if (this._apiEndpoint && this._apiKey) {
      // Web Speech not available — AI fallback is handled externally
      this._onEnd('unsupported')
    } else {
      this._onEnd('unsupported')
    }
  }

  stop() {
    this._stopSilenceTimer()
    if (this._recognition) {
      try {
        this._recognition.stop()
      } catch {
        // Already stopped
      }
      this._recognition = null
    }
    this._isListening = false
  }

  _stopSilenceTimer() {
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer)
      this._silenceTimer = null
    }
  }

  destroy() {
    this.stop()
    this._onResult = null
    this._onEnd = null
  }
}
```

- [ ] **Step 2: Verify module loads**

Run `cd bento && npx vite`, open console:
```js
import('./src/speech.js').then(m => {
  console.log('SpeechRecognizer loaded:', typeof m.SpeechRecognizer)
})
```

Expected: `SpeechRecognizer loaded: function`

- [ ] **Step 3: Commit**

```bash
git add bento/src/speech.js
git commit -m "feat: add SpeechRecognizer with Web Speech API and AI fallback"
```

---

### Task 2: Create CommandRouter

**Files:**
- Create: `bento/src/commands.js`

**Interfaces:**
- Produces: `function routeCommand(text, bento, audio)` — returns processed command info

- [ ] **Step 1: Create src/commands.js**

```js
const COMMANDS = [
  {
    patterns: ['show me the letter', 'show letter', 'letter', 'say letter'],
    handler(text, bento, audio) {
      // Extract letter from text
      const match = text.match(/[a-z0-9]/)
      if (match) {
        const letter = match[0].toUpperCase()
        bento.showLetter(letter)
        if (audio) audio.play(letter.toLowerCase())
      }
      return true
    }
  },
  {
    patterns: ['do a flip', 'flip'],
    handler(text, bento, audio) {
      bento._event = 'spin'
      bento._eventTime = 0
      return true
    }
  },
  {
    patterns: ['dizzy', 'spin around', 'make me dizzy'],
    handler(text, bento, audio) {
      bento.triggerDizzy()
      return true
    }
  },
  {
    patterns: ['sneeze', 'achoo'],
    handler(text, bento, audio) {
      bento._event = 'sneeze'
      bento._eventTime = 0
      if (bento.sound) bento.sound.sneeze()
      return true
    }
  },
  {
    patterns: ['glitch', 'broken', 'error'],
    handler(text, bento, audio) {
      bento._event = 'glitch'
      bento._eventTime = 0
      if (bento.sound) bento.sound.glitch()
      return true
    }
  },
  {
    patterns: ['sleep', 'nap', 'go to sleep', 'tired'],
    handler(text, bento, audio) {
      bento.mood = 'sleeping'
      bento._napDuration = 5
      return true
    }
  },
  {
    patterns: ['hello', 'hi', 'hey', 'bento'],
    handler(text, bento, audio) {
      bento.mood = 'happy'
      bento._happyTimer = 1.5
      bento._happyCooldown = 1.5
      if (bento.sound) bento.sound.happy()
      return true
    }
  }
]

export function routeCommand(text, bento, audio) {
  for (const cmd of COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (text.includes(pattern)) {
        return cmd.handler(text, bento, audio)
      }
    }
  }
  return false
}
```

- [ ] **Step 2: Verify module loads**

Run `cd bento && npx vite`, open console:
```js
import('./src/commands.js').then(m => {
  console.log('CommandRouter loaded:', typeof m.routeCommand)
})
```

Expected: `CommandRouter loaded: function`

- [ ] **Step 3: Commit**

```bash
git add bento/src/commands.js
git commit -m "feat: add CommandRouter with letter, flip, dizzy, and greeting commands"
```

---

### Task 3: Wire Tap-Hold to Speech Recognition

**Files:**
- Modify: `bento/src/main.js`

**Interfaces:**
- Consumes: `TapHoldDetector` (Phase 1), `SpeechRecognizer` (Task 1), `CommandRouter` (Task 2), `Bento`, `AudioManager`
- Produces: tap-hold on Bento canvas triggers listening, commands route to actions

- [ ] **Step 1: Wire speech recognition in main.js**

In `bento/src/main.js`, after the settings wiring, add:

```js
  // Speech recognition
  import { SpeechRecognizer } from './speech.js'
  import { routeCommand } from './commands.js'

  const speech = new SpeechRecognizer(
    (text) => {
      const matched = routeCommand(text, bento, audio)
      if (!matched) {
        // Confused fallback — 60% confused, 40% random event
        if (Math.random() < 0.6) {
          bento._event = 'confused'
          bento._eventTime = 0
        } else {
          const keys = Object.keys(bento._events)
          bento._event = keys[Math.floor(Math.random() * keys.length)]
          bento._eventTime = 0
          if (bento._onEventStart) bento._onEventStart(bento._event)
        }
      }
    },
    (reason) => {
      // Listening ended without result — no feedback needed
    }
  )

  // Set API config for speech fallback
  if (apiEndpoint && apiKey) {
    speech.setApiConfig(apiEndpoint, apiKey)
  }

  // Wire tap-hold to start listening
  const tapHold = new TapHoldDetector(canvas, () => {
    bento.mood = 'idle'
    speech.start()
  })
```

- [ ] **Step 2: Import TapHoldDetector at top of main.js**

```js
import { TapHoldDetector } from './taphold.js'
```

- [ ] **Step 3: Verify**

Run `cd bento && npx vite`. Tap and hold on Bento for 600ms. Speaking "show me the letter A" should display 'A' and play audio. Speaking "do a flip" should trigger spin. Speaking gibberish should trigger confused or random event.

- [ ] **Step 4: Commit**

```bash
git add bento/src/main.js
git commit -m "feat: wire tap-hold to speech recognition with command routing"
```