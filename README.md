# Bento

A cute pixel-art robot head that lives in your browser. Tap him, pet him, shake your phone, or talk to him — he chirps, blinks, gets dizzy, takes naps, wears accessories, and recognizes your voice.

Built with Vite, Canvas API, and Web Audio API. Zero external dependencies.

## Quick Start

```bash
cd bento
npm install
npm run dev
```

Open `http://localhost:5173/bento/` and tap Bento.

## Deploy

Push to `main` and GitHub Actions auto-deploys to [GitHub Pages](https://jameslocks.github.io/bento/).

```bash
git push origin main
```

## Features

### Core
- Animated pixel-art robot with customizable skin system
- Responsive canvas sizing — fits mobile viewport, capped at 640px on desktop
- Portrait canvas (1.5:1 aspect ratio) to fit accessories and letter display
- Smooth 60fps game loop with requestAnimationFrame

### Events & Moods
React to taps, voice commands, and random idle triggers:

| Event | Duration | What Happens |
|-------|----------|--------------|
| Happy | 1.5s | Bounce up, jiggle, cheek blush, ascending chirp |
| Glitch | 0.5s | Eyes scramble, static lines, sawtooth buzz sound |
| Spin | 0.8s | Full 360° rotation |
| Sneeze | 0.6s | Lurch down then back |
| Dizzy | 2.0s | Eyes orbit in circles, LFO-wobbled sound |
| Rainbow | 1.2s | Visor cycles through rainbow hues |
| Heart | 1.8s | Eyes become pink hearts |
| Curious | 2.0s | Eyes grow larger, head tilts |
| Excited | 1.2s | Eyes sparkle, rapid vibration |
| Confused | 1.5s | Uneven eyes, head tilt |
| Surprised | 0.5s | Shocked eyes, upward jump (on tap while sleeping) |
| Sleeping | 5s | Closed eyes, gentle bob, floating Zzz |

Random events fire autonomously when idle. Tap Bento for a happy reaction (75%) or glitch (25%).

### Accessories
Five equippable pixel-art accessories that appear randomly or on special occasions:
- **Party hat** — auto-applied on your birthday (configured in settings)
- **Bowtie** — purple butterfly
- **Sunglasses** — dark lenses with reflection
- **Earmuffs** — red ear warmers
- **Crown** — gold 3-point crown (unlocked at bonding milestone)

Random accessory: 5% chance every 10-25s during idle, lasts 2-3 minutes.

### Speech & Voice Commands
Press and hold (600ms) on Bento to start voice recognition. Say:

| Command | Reaction |
|---------|----------|
| "hello", "hi", "hey", "bento" | Happy mood + sound |
| "do a flip", "flip" | Spin event |
| "dizzy", "spin around", "make me dizzy" | Dizzy event |
| "sneeze", "achoo" | Sneeze event + sound |
| "glitch", "broken", "error" | Glitch event + sound |
| "sleep", "nap", "go to sleep", "tired" | Sleep mood |
| "letter A", "show me the letter B" | Display + speak the letter |

Unrecognized commands trigger a confused reaction (60%) or random event (40%).

### Educational Mode
Toggle in settings. When active, tapping cycles through A-Z and 0-9:
- Large letter displayed below Bento for 3 seconds
- Corresponding letter sound plays (preloaded MP3 or AI voice fallback)
- Perfect for kids learning the alphabet

### Audio
- **Procedural sound effects** via Web Audio API — chirps, boops, sneezes, glitches, and more
- **Letter audio** — preloads `/audio/{letter}.mp3` files for educational mode
- **AI TTS fallback** — configurable OpenRouter/OpenAI endpoint for letter pronunciation
- **Bento speaks** — configurable voice model, speed, and tone instructions via settings

### Settings
Full-screen overlay (gear icon, top-right):
- API Endpoint & Key (for AI voice/speech fallback)
- Kid's Name
- Birthday (month/day — auto-applies party hat)
- Educational Mode toggle
- Voice Model, Speed, and Instructions
- All settings persist to localStorage

### Bonding & Streaks
Daily visit tracking with milestone rewards (stored in localStorage):

| Streak | Reward | Duration |
|--------|--------|----------|
| 1 day | Rainbow glow on visor | 5 min |
| 5 days | Crown accessory | 5 min |
| 10 days | Sparkle particles | 5 min |
| 25 days | Golden border pulse | 5 min |
| 50 days | Halo above antenna | 5 min |
| 100 days | All effects combined + super sparkle | 10 min |

### Shake Detection
Shake your phone to trigger the dizzy reaction (requires device motion API).

### Time Awareness
Bento knows the time of day:
- **Morning (6-10)** — brighter, bouncier
- **Day (11-16)** — normal behavior
- **Evening (17-20)** — warm orange tint, slower blinks
- **Night (21-5)** — darker overlay, heavy-lidded eyes, very slow blink

### Firefly
A friendly green firefly visits every 60-90 seconds during idle, tracing a figure-8 path with a glowing trail. Tap it for a sparkle burst and chirp sound.

### Panko
A mischievous circular robot that drops by as a very rare recurring visitor. His behavior evolves across visits:
1. **Shy** (visits 1-2) — rolls in, pauses, leaves
2. **Curious** (visits 3-5) — circles around Bento
3. **Playful** (visits 6-10) — bumps into Bento
4. **Chaotic** (visits 11+) — zooms in, circles, bumps, blurs out

Visit count and name persist in localStorage.

### Debug Panel
Press `D` to open a floating debug panel with buttons to trigger any event, mood, accessory, letter display, bonding, Panko, TTS, and live state monitoring.

### Mobile Support
- Responsive canvas sizing optimized for mobile viewports
- Touch-friendly with `touch-action: manipulation`
- Works offline as a PWA
- Shake detection for dizzy reaction

## Built With

- [Vite](https://vitejs.dev/) — Build tool
- Canvas API — Pixel-art rendering
- Web Audio API — Sound synthesis
- Web Speech API — Voice recognition
- Pointer Events API — Tap-hold gesture detection
- DeviceMotion API — Shake detection