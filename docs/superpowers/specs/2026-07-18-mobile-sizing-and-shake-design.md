# Mobile Viewport Sizing & Shake-to-Dizzy

## Overview

Two features to improve Bento on mobile:
1. Use more of the viewport on phones/tablets while capping size on desktop.
2. React to phone shakes with a "dizzy" animation (bouncing + spinning donut eyes).

---

## Feature 1: Canvas Resize

### Current Behavior

`bento.js:_resize()` computes `displaySize = min(window.innerWidth, window.innerHeight) * 0.6`. On a 390px phone that yields ~234px — too small.

### New Behavior

```
displaySize = min(window.innerWidth * 0.9, window.innerHeight * 0.8)
scale       = max(4, floor(displaySize / 32))
rawSize     = 32 * scale
cappedSize  = min(rawSize, 640)
```

| Device   | Viewport | Size   |
|----------|----------|--------|
| Phone    | 390×844  | ~351px |
| Tablet   | 768×1024 | ~614px |
| Desktop  | 1920×1080| 640px  |

### Files Changed

- `bento.js` — `_resize()` method only.

---

## Feature 2: Shake → Dizzy

### New File: `src/shake.js`

A `ShakeDetector` class with:

- Listens to `window.devicemotion` events.
- Computes total acceleration = `sqrt(x² + y² + z²)`.
- If total exceeds a threshold (default `20 m/s²`) and cooldown has elapsed, fires callback.
- Cooldown: 3 seconds between shake triggers.
- `destroy()` removes the event listener.

Only instantiated if `DeviceMotionEvent` is available — desktop is a no-op.

### Changes to `bento.js`

- **New event**: `dizzy` added to `this._events` with duration `2.0`.
- **New method `triggerDizzy()`**: sets `this.mood = 'idle'`, cancels current event, starts `dizzy` event. Called from `main.js` shake callback.
- **Bounce offset**: In `_getBounceOffset()`, a `dizzy` branch that oscillates rapidly (high-frequency sine) for the first half, fading to gentle wobble.
- **Body wobble**: In `_draw()`, add a slight rotation oscillation during `dizzy` (small angle, ~0.05 rad).

### Changes to `src/sound.js`

- **New method `dizzy()`**: Descending wobble sound — oscillator frequency sweeps from ~800Hz down to ~200Hz with a triangle/sine wave, fast vibrato (LFO on frequency), ~0.4s duration.

### Changes to `src/skins/default.js`

- **New `dizzy` eye branch** in `drawEyes()`:
  - Eyes orbit their center positions (`cx ± 4`, `cy`) in a circle of radius ~2.5 grid units.
  - Orbit angle starts fast and decelerates over the event duration (ease-out).
  - Draw a small donut trail: a translucent ring showing the orbit path, with the eye dot at the current angle.

### Changes to `src/main.js`

- Import `ShakeDetector`.
- After `bento.start()`, create `new ShakeDetector(() => bento.triggerDizzy())`.

### State Wiring

`state` object passed to skin `drawEyes()` already includes `event` and `eventTime`. No additional state fields needed — the existing `eventTime / events.dizzy` ratio gives the progress for deceleration and the skin can compute the orbit angle from it.

---

## Files Changed (Summary)

| File | Change |
|------|--------|
| `src/bento.js` | `_resize()` formula; new `dizzy` event in `_events`; `triggerDizzy()` method; `dizzy` branch in `_getBounceOffset()`; body wobble in `_draw()` |
| `src/shake.js` | New file — `ShakeDetector` class |
| `src/sound.js` | New `dizzy()` method |
| `src/skins/default.js` | New `dizzy` branch in `drawEyes()` |
| `src/main.js` | Wire `ShakeDetector` to `bento.triggerDizzy()` |

No CSS, HTML, or config changes.