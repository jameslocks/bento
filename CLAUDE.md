# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The app lives in `bento/` (not the repo root). Run everything from there:

```bash
cd bento
npm install
npm run dev       # Vite dev server at http://localhost:5173/bento/
npm run build     # outputs bento/dist
npm run preview
npm test          # Vitest (tests/)
npm run lint      # ESLint over src/
```

Tests live in `bento/tests/` (pure-logic modules plus a canvas-stubbed `Bento` smoke test). Vite `base` is `/bento/`, so the dev URL needs the `/bento/` prefix. Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Architecture

Vanilla JS (ES modules), Canvas 2D, Web Audio, Web Speech — no runtime dependencies, no framework.

- `src/main.js` is the composition root: builds `SoundEngine`, `Bento`, `AudioManager`, `SettingsStore`, `SpeechRecognizer`, `TapHoldDetector`, `ShakeDetector`, wires the settings overlay form, and exposes `window.__bento`. Tap-hold starts speech recognition; recognized text goes through `commands.js` `routeCommand`, with a confused/random-event fallback.
- `src/bento.js` (`Bento`) is the central class: a `requestAnimationFrame` loop (dt clamped to 0.1s) calling `_update(dt)` then `_draw()`, the mood state machine (`idle`/`happy`/`sleeping`/`surprised`), timed random events, accessories, letter display, and Panko/bonding orchestration. `src/firefly.js` (`Firefly`) and `src/particles.js` (`ParticleSystem`) are standalone `update(dt)`/`draw()` modules. Outside code (`main.js`, `commands.js`, `debug.js`) must use Bento's public API (`triggerEvent`, `triggerRandomEvent`, `triggerDizzy`, `makeHappy`, `sleep`, `surprise`, `becomeIdle`, `setAccessory`, `applyBirthday`, `spawnPanko`, `debugState`, …) rather than `_private` fields. Adding a new event means an entry in `EVENT_DURATIONS` (add to `RANDOM_EVENTS` unless it shouldn't fire on its own), side effects in `_onEventStart`, and a renderer in the skin; the skin gets `eventProgress` (0–1) so it needn't know durations.
- Rendering uses a logical 32×32 grid scaled to the canvas (`GRID`, `_scale`; the canvas is sized to a whole multiple and multiplied by `devicePixelRatio`, with the context transform set in `_resize`). The sprite is drawn `SPRITE_Y_OFFSET` grid units down; the canvas is portrait (1.5:1) to leave room for accessories and the letter display.
- `src/skins/` holds skins as plain objects (`palette`, `drawHead`, `drawEyes`, `drawAntenna`, `drawAccessory`, plus optional `drawAura`/`drawOverlay`) that receive `(ctx, palette, state, time)`. `Bento` passes a state object describing the current event/mood; visual effects (rainbow visor, bonding glow, halo, hearts) are drawn by the skin, not `Bento`. `skins/index.js` is the registry (`getSkin`).
- `src/accessories.js` — pixel-art accessory drawing, used by the skin.
- `src/bonding.js` (`BondingTracker`) — daily-visit streak (local dates) in localStorage; milestone effects (`crown`, `supreme`, etc.) queried via `hasEffect()` and last a fixed time after each page load. `checkAndUpdate()` is called about once a minute, not per frame.
- `src/panko.js` — the Panko visitor; behavior stage depends on a persisted visit count. It interacts with Bento's events (curious on spawn, confused on bump).
- `src/sound.js` (`SoundEngine`) is procedural Web Audio SFX. `src/audio.js` (`AudioManager`) lazily loads letter mp3s from `public/audio/` (via `import.meta.env.BASE_URL`) and falls back to OpenRouter/OpenAI TTS; configure with `setApiConfig` and `configureVoice`. Both share one context from `src/audio-context.js`.
- `src/timekeeper.js` — time-of-day phases (tints/blink speed). `src/shake.js` — DeviceMotion shake → `triggerDizzy`. `src/debug.js` — floating debug panel toggled with `D`, loaded only in dev or with `?debug` in the URL (which also exposes `window.__bento`); useful for triggering any event/mood/accessory without waiting for timers.
- Persistence is all localStorage with the `bento:` prefix (`SettingsStore` for settings, with `DEFAULTS` and typed values; `main.js` `applySettings()` pushes them into live objects on load and on save; bonding and Panko store their own keys). Settings include the API key, kid's name, birthday, educational mode, and voice options.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (jameslocks/bento) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
