# Bento — Cute Pixel Art Robot for GitHub Pages

## Overview

A single-page web app featuring **Bento**, a cute pixel-art robot head that lives on a web page. Bento has animated eyes displayed on a visor/screen, makes synthesized robot sounds, reacts to being tapped, and does his own thing (idle animations, random chirps, gentle movement). Built with Canvas API, Web Audio API, and Vite, deployable to GitHub Pages.

## Architecture

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  App Shell   │  │   Robot      │  │  Sound       │
│  (HTML/CSS)  │──│   Engine     │──│  Engine      │
│              │  │  (Canvas)    │  │  (Web Audio) │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                    ┌────▼───────┐
                    │   Skins    │
                    │ (Modules)  │
                    └────────────┘
```

- **Bento Engine** — core class with `requestAnimationFrame` loop, state machine, Canvas drawing
- **Sound Engine** — Web Audio API oscillator-based synthesis for chirps/beeps/boops
- **Skins** — modular JS modules exporting palette + draw functions
- **App Shell** — minimal HTML page with centered canvas, background, skin selector

## Tech Stack

- **Build:** Vite (vanilla JS)
- **Rendering:** HTML5 Canvas (pixel art at 32x32 logical grid, scaled up)
- **Audio:** Web Audio API (oscillators + gain envelopes, no external files)
- **Deployment:** GitHub Actions → GitHub Pages
- **Dependencies:** None (zero external libraries)

## Visual Design

### Robot Appearance

- **Head:** White rounded rectangle, ~32x32 logical pixel grid scaled up
- **Visor:** Large dark screen dominating ~60% of the face, eyes rendered inside
- **Antenna:** Small antenna on top with a glowing pixel dot
- **Eyes:** Simple pixel-art shapes inside the visor — dots, circles, or patterns

### Skins

Each skin is a JS module at `src/skins/<name>.js` exporting:

```js
{
  name: "Default",
  palette: {
    head: "#ffffff",
    visor: "#1a1a2e",
    eye: "#4fc3f7",
    cheek: "#ff8a80",
    antenna: "#aaaaaa",
    glow: "#ffd54f"
  },
  drawHead(ctx, palette, time) {},
  drawEyes(ctx, palette, state, time) {},
  drawAntenna(ctx, palette, time) {}
}
```

Default skin: white head, navy visor, light blue eyes, pink cheeks, gray antenna.

Skins are registered in `src/skins/index.js` and switchable via a small UI selector.

## State Machine

| State | Trigger | Behavior | Duration |
|-------|---------|----------|----------|
| `idle` | Default / after `happy` ends | Gentle vertical bob, random blinks (3-5s interval), random chirps (8-15s interval) | indefinite |
| `happy` | Tap/click | Eyes widen, faster bounce, ascending chirp, optional sparkle particles | ~1.5s → idle |

### Idle Animations

- **Float:** Smooth vertical sine oscillation (~2px amplitude, slow frequency)
- **Blink:** Eyes close for ~100ms, then reopen
- **Chirp:** Small bounce + short chirp sound

### Happy Animation

- Eyes change shape (widen or switch to ^_^ pattern)
- Quick upward bounce followed by settle
- Higher-pitched two-tone ascending chirp
- Optional: small sparkle/star particle effects

## Sound Engine

### API

```js
// all methods return void, fail silently if audio context blocked
sound.chirp()   // short high-pitched sine, ~100ms
sound.boop()    // medium triangle wave, ~150ms  
sound.happy()   // ascending two-tone sequence, ~200ms
```

### Implementation

- Creates `AudioContext` lazily on first user interaction
- Each sound: oscillator node + gain node (attack/decay envelope)
- Oscillator types: sine, square, triangle
- All synthesized programmatically — no audio files

### Error Handling

- AudioContext creation wrapped in try/catch
- If browser blocks audio, sounds are silently skipped
- No user-facing error for audio failures

## Project Structure

```
bento/
├── index.html              # App shell
├── package.json            # Vite + scripts
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js             # Entry point, boots app
│   ├── bento.js            # Bento engine class
│   ├── sound.js            # Web Audio API synthesis
│   ├── skins/
│   │   ├── index.js        # Skin registry
│   │   └── default.js      # Default skin
│   └── style.css           # Page styling
├── public/
│   └── favicon.svg         # Tiny robot face icon
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions → Pages
```

## Error Handling & Edge Cases

- **Canvas unsupported:** Display fallback text message
- **Audio blocked:** Sounds silently skipped, robot continues visually
- **Skin load failure:** Fall back to default skin
- **Multiple rapid taps:** Cooldown period on `happy` state (~1.5s), ignore taps during transition
- **Mobile:** Touch events handled alongside click events

## Deployment

- GitHub Actions workflow triggers on push to `main`
- Vite builds to `dist/`, deploys to `gh-pages` branch
- Standard GH Pages setup with `vite.config.js` setting `base: '/bento/'`

## Out of Scope (for now)

- Full body / limbs
- Multiple sound themes
- Backend or persistence
- Unit tests (can be added later)