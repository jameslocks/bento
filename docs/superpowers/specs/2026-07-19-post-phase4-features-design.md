# Bento Post-Phase-4 Feature Design

> Six features to add after Phase 4 (Speech & Commands) is complete.
> Covers time-of-day awareness, TTS, bonding/streaks, firefly improvements, Panko event, and education mode (deferred).

## Overview

Six independent features of varying complexity. Each is designed as a self-contained module or extension to existing systems. None require external dependencies. All are built on top of the existing Phase 4 state (settings overlay, tap-hold, speech recognition, command routing, accessory system, educational mode).

## Features

### 1. Time-of-Day Awareness

**Module:** `src/timekeeper.js`

A lightweight wrapper around `Date` that computes time-of-day periods. No timers — pure Date checks on each frame.

**Periods:**

| Period | Hours | Mood baseline | Visual changes |
|--------|-------|---------------|----------------|
| Morning | 6-11 | happy | Slightly bouncy antenna, bright blink (higher blink alpha) |
| Day | 12-16 | idle | Normal (same as current) |
| Evening | 17-20 | idle | Slower blink speed, 10° orange hue shift on palette |
| Night | 21-5 | drowsy | Heavy-lidded eyes (eyes drawn 20% shorter), very slow blink, muted palette (-20% saturation) |

**API:**
- `getPeriod()` → `'morning' | 'day' | 'evening' | 'night'`
- `getBlend()` → `0..1` (transition blend at period boundaries, 1 = fully in period)

**Integration:**
- `bento.js` imports `TimeKeeper` in `_update()` and passes `timePeriod` in the state object to the skin
- `default.js` `drawHead()` uses `state.timePeriod` to adjust palette: `morning` boosts saturation, `evening` adds orange hue, `night` reduces saturation
- `_updateBlink()` in `bento.js` uses period to adjust blink interval and speed

**No state beyond Date.** No storage, no config. Resets on every page load.

---

### 2. Bento Talks Back (TTS)

**Module:** Extends `src/audio.js` (AudioManager)

New method `speak(text, voice?)` that calls OpenRouter's `/api/v1/audio/speech` endpoint.

**Voice config (stored in SettingsStore):**
- `voiceModel`: string — model ID, default `openai/gpt-4o-mini-tts-2025-12-15`
- `voiceInstructions`: string — e.g., "Speak like a friendly robot", passed as OpenAI provider instructions
- `voiceSpeed`: number — 0.5-2.0, default 1.0

**Settings overlay additions:**
- Voice model (text input, default already filled)
- Voice instructions (textarea, 2-3 rows)
- Voice speed (number input, step 0.1, min 0.5, max 2.0)

**AudioManager changes:**
```js
async speak(text, voice, instructions, speed) {
  const model = voice || this._voiceModel
  const resp = await fetch(`${this._apiEndpoint}/audio/speech`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${this._apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: text, voice: 'alloy', response_format: 'mp3', speed: speed || 1.0,
      provider: { options: { openai: { instructions: instructions || '' } } }
    })
  })
  const blob = await resp.blob()
  await this._playBuffer(blob)
}
```

**Usage:**
- Not wired to anything automatically — plumbing only
- Can be triggered via debug panel
- Future use: educational mode pronunciation, command responses, greeting on daily visit

---

### 3. Streak / Bonding

**Module:** `src/bonding.js`

`BondingTracker` class that tracks consecutive daily visits.

**Storage:**
- localStorage `bento:bonding`: `{ lastVisit: '2026-07-19', streak: 5, milestoneNotified: [1, 5] }`

**Core logic:**
1. On init, read `bento:bonding` from localStorage
2. If `lastVisit` is yesterday → increment streak
3. If `lastVisit` is today → do nothing (already counted)
4. If `lastVisit` is older → reset streak to 1
5. Check if current streak hits a milestone

**Milestones:**

| Streak | Effect | Duration | Implementation |
|--------|--------|----------|----------------|
| 1 | Rainbow glow on visor | 5 min | Same pattern as existing `rainbow` event, but on visor only |
| 5 | Crown accessory | 5 min | Auto-apply via `_setAccessory('crown')` — new crown accessory |
| 10 | Sparkle particles | 3 min | Reuse `_particles` system, spawn sparkle particles every 0.5s |
| 25 | Golden border pulse | 5 min | Draw a pulsing golden rect around Bento in `_draw()` |
| 50 | Halo above antenna | 5 min | Draw a glowing ellipse above antenna in `drawAntenna()` |
| 100 | All previous combined + super sparkle | 10 min | Combine all effects, double particle rate |

**Mood effect:** When any milestone is active, `_update()` blends mood toward `happy` over 2 seconds.

**Crown accessory:** New draw function in `accessories.js`. Small golden crown centered at `(cx, topY - 6)`. Three points, yellow/gold fill with darker outline.

---

### 4. Education Mode (Deferred)

No spec yet. User will revisit later.

---

### 5. Firefly Improvements

**File:** `bento/src/bento.js` — modify existing `_firefly` state and `_drawFirefly()` method.

**Current state:**
- `_firefly = { active, timer, x, y, angle, speed, radius, duration, elapsed }`
- Random walk, draws as a single glowing dot, fades after duration

**Changes:**

1. **Size:** Keep current size (no change)

2. **Movement path:** Change from random walk to figure-8 Lissajous path:
   ```js
   const fig8x = cx + radius * Math.sin(angle)
   const fig8y = cy + radius * Math.sin(2 * angle)
   ```
   `angle` advances by `speed * dt` each frame.

3. **Trail:** Store last 8 positions in a ring buffer (`this._fireflyTrail = []`, push current position each frame). Draw as translucent circles with decreasing alpha (0.3 → 0.0) and shrinking radius.

4. **Tap interaction:** In `_handleTap()`, if firefly is active and tap is near firefly position (within 3 grid units), spawn a sparkle burst:
   - Clear firefly (reset timer, set inactive)
   - Spawn 5-8 particles at firefly position with random velocity (spread outward)
   - Play `sound.fireflyChirp()`

5. **Rarity:** Increase timer range from `20 + Math.random() * 20` to `60 + Math.random() * 30` (appears roughly every 1-1.5 minutes instead of 20-40 seconds)

6. **Sound:** Add `fireflyChirp()` to `SoundEngine` — short high-pitched chirp: sine wave 1200Hz → 800Hz over 0.15s

**Sparkle burst particles:** Reuse `_particles` array but with a special `type: 'sparkle'` flag. Sparkle particles only draw for 0.5s, fade quickly, no physics (just velocity + gravity).

---

### 6. Panko Event

**Module:** `src/panko.js`

A mischievous circular robot character that appears as a very rare recurring event.

**Storage (localStorage `bento:pankoData`):**
```json
{ "visitCount": 7, "lastVisit": "2026-07-19", "name": "Panko" }
```

**Settings overlay addition:**
- "Panko's Name" text input (default "Panko")

**Panko class API:**
```js
class Panko {
  constructor(bento)
  start()        // begin the event
  update(dt)     // animate movement
  draw(ctx)      // render Panko
  isActive()     // bool
}
```

**Event trigger:**
- Very rare: ~2% chance every 15-20s (same check timer as accessories)
- Only when idle, no event, no accessory active
- Does not trigger if Panko visited in the last 5 minutes

**Panko appearance:**
- Circular body: radius 4, filled `#ff8a65`, outline `#ffd54f`, lineWidth 0.8
- One eye: circle (neutral), half-circle-top (happy), small dot (suspicious)
- Small antenna: 1px line up from top, 1px circle at tip, blinking light (alternates every 0.3s between `#fff` and `#ffd54f`)
- Size: scales with `this._scale`

**Movement:**
- Enters from a random edge (top/bottom/left/right), outside canvas bounds
- Moves toward a target near Bento (within 3 grid units of center)
- Reaches target, performs behavior, then exits toward a random edge
- Speed: 2 grid units/sec (slow), 4 (medium), 6 (fast)

**Behavior phases (driven by visitCount):**

| Visits | Phase | Entry speed | Behavior | Exit speed |
|--------|-------|-------------|----------|------------|
| 0-2 | shy | 1.5 | Rolls in, pauses near Bento looking at him, eye = neutral, pauses 2s | 2 |
| 3-5 | curious | 2 | Rolls in, circles Bento once (orbit radius 6, 3s), eye = happy, antenna blinks fast | 3 |
| 6-10 | playful | 3 | Rolls in fast, bumps into Bento (stops 1 unit away for 0.5s), does a spin (rotates 360° over 1s), eye changes rapidly | 4 |
| 11+ | chaotic | 4 | Zooms in, does 2 circles, rapid eye changes every 0.5s, bumps twice, exits in a blur (fast fade + scale down) | 6 |

**Sound:**
- Add `sound.panko()` to `SoundEngine` — two-tone ascending beep: square wave 400Hz → 600Hz over 0.2s, play twice with 0.1s gap
- Chaotic phase: play at double speed

**Drawing order:** Panko is drawn after the firefly, before the debug panel overlay.

**Panko state in Bento:**
```js
this._panko = null | {
  instance: Panko,         // Panko class instance
  visitCount: number       // from localStorage
}
```

---

## Glitch Tap Sparks — Timing Fix

Existing behavior: tapping Bento has a 25% chance to trigger a glitch event with spark particles. Sparks currently have `life: 0.4 + random() * 0.3` (0.4-0.7 seconds) — too fast to see.

**Fix:** Increase spark lifetime to `1.5 + random() * 1.0` (1.5-2.5 seconds). Sparks will expand and fade visibly over a longer duration, making them recognizable as sparks rather than invisible flash effects.

**File:** `bento/src/bento.js` line 331 (in `_spawnSparks()`)

## Implementation Order

All features are independent. Recommended order based on complexity and dependencies:

1. **Firefly improvements** — smallest change, touches existing code minimally
2. **Time-of-Day** — new module, adds state field to bento.js
3. **Panko** — new module, moderate complexity
4. **Bonding/Streaks** — new module, adds accessory + particles
5. **TTS** — extends existing AudioManager, adds settings fields
6. **Education mode** — deferred

## Testing

No test framework exists. Manual testing:
- Load the page, verify no console errors
- For each feature, trigger via debug panel or natural interaction
- Check localStorage for expected keys/values

## Files Created

- `src/bonding.js` — BondingTracker class
- `src/panko.js` — Panko event class
- `src/timekeeper.js` — TimeKeeper utility

## Files Modified

- `bento/src/skins/default.js` — time period palette, crown accessory draw
- `bento/src/skins/default.js` or `accessories.js` — crown accessory definition
- `bento/src/bento.js` — firefly improvements, time period, Panko state
- `bento/src/audio.js` — speak() method
- `bento/src/sound.js` — fireflyChirp(), panko() sounds
- `bento/src/main.js` — wire new modules
- `bento/index.html` — new settings fields
- `bento/src/style.css` — new settings field styles
- `bento/src/debug.js` — new debug buttons