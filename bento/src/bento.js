import { PankoEvent } from './panko.js'
import { accessories } from './accessories.js'
import { getPeriod, getBlend, isNight } from './timekeeper.js'
import { BondingTracker } from './bonding.js'
import { Firefly } from './firefly.js'
import { ParticleSystem } from './particles.js'

const GRID = 32
const CENTER = GRID / 2
/** The sprite is drawn this many grid units down to leave headroom for accessories. */
const SPRITE_Y_OFFSET = 8
const MAX_DT = 0.1

/** Event name -> duration in seconds. */
const EVENT_DURATIONS = {
  glitch: 0.5,
  spin: 0.8,
  sneeze: 0.6,
  rainbow: 1.2,
  heart: 1.8,
  curious: 2.0,
  excited: 1.2,
  confused: 1.5,
  dizzy: 2.0
}
/** Events that can start on their own while idle. */
const RANDOM_EVENTS = Object.keys(EVENT_DURATIONS).filter(e => e !== 'dizzy')

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const rand = (min, max) => min + Math.random() * (max - min)
const pick = (list) => list[Math.floor(Math.random() * list.length)]

export class Bento {
  constructor(canvas, skin, sound) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.skin = skin
    this.sound = sound

    this._scale = 1
    this._cssWidth = 0
    this._cssHeight = 0
    this._resize()

    this._rafId = null
    this._lastTime = 0
    this._time = 0

    // Mood state machine: idle | happy | sleeping | surprised
    this.mood = 'idle'
    this._happyTimer = 0
    this._happyCooldown = 0
    this._moodBlend = 0
    this._surprisedTimer = 0
    this._napTimer = rand(30, 60)
    this._napDuration = 0

    // Idle animation
    this._blinkTimer = rand(3, 5)
    this._isBlinking = false
    this._blinkDuration = 0.1
    this._chirpTimer = rand(8, 15)
    this._lookX = 0
    this._lookY = 0
    this._lookTargetX = 0
    this._lookTargetY = 0
    this._lookTimer = rand(2, 4)

    // Timed events
    this._event = null
    this._eventTime = 0
    this._eventCheckTimer = rand(10, 25)

    // Accessories
    this._accessory = null
    this._accessoryTimer = 0
    this._accessoryCheckTimer = rand(10, 25)

    // Letter display / educational mode
    this._displayLetter = null
    this._displayLetterTimer = 0
    this._educationalMode = false
    this._letterIndex = 0
    this.audio = null

    this._particles = new ParticleSystem()
    this.firefly = new Firefly()

    // Panko visitor
    this.panko = null
    this._pankoCheckTimer = rand(15, 25)
    this._lastPankoTime = 0

    // Bonding / streaks
    this.bonding = new BondingTracker()
    this._bondingCrownTimer = 0
    this._bondingCheckTimer = 60
    this._handleBondingResult(this.bonding.checkAndUpdate())
    if (this.bonding.hasEffect('crown') || this.bonding.hasEffect('supreme')) {
      this.setAccessory('crown')
    }

    // 25% of taps cause a spark+glitch instead of a happy reaction
    this._tapGlitchChance = 0.25

    this._onTap = this._handleTap.bind(this)
    this.canvas.addEventListener('click', this._onTap)
  }

  // ---------------------------------------------------------------- lifecycle

  start() {
    this._lastTime = performance.now()
    this._loop(this._lastTime)
  }

  resize() {
    this._resize()
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this.canvas.removeEventListener('click', this._onTap)
  }

  setSkin(skin) {
    this.skin = skin
  }

  _resize() {
    const available = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8, 640)
    this._scale = Math.max(4, Math.floor(available / GRID))
    this._cssWidth = this._scale * GRID
    this._cssHeight = Math.round(this._cssWidth * 1.5)

    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.round(this._cssWidth * dpr)
    this.canvas.height = Math.round(this._cssHeight * dpr)
    this.canvas.style.width = this._cssWidth + 'px'
    this.canvas.style.height = this._cssHeight + 'px'
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  _loop(timestamp) {
    const dt = Math.min(MAX_DT, (timestamp - this._lastTime) / 1000)
    this._lastTime = timestamp
    this._time += dt

    this._update(dt)
    this._draw()

    this._rafId = requestAnimationFrame((t) => this._loop(t))
  }

  // ------------------------------------------------------------- public API

  /** Start a named event (see EVENT_DURATIONS). Unknown names are ignored. */
  triggerEvent(name) {
    if (!(name in EVENT_DURATIONS)) return
    this._event = name
    this._eventTime = 0
    this._onEventStart(name)
  }

  triggerRandomEvent() {
    this.triggerEvent(pick(RANDOM_EVENTS))
  }

  clearEvent() {
    this._event = null
    this._eventTime = 0
  }

  triggerDizzy() {
    this.mood = 'idle'
    this.triggerEvent('dizzy')
  }

  makeHappy() {
    this.mood = 'happy'
    this._happyTimer = 1.5
    this._happyCooldown = 1.5
    this.sound.happy()
  }

  sleep(duration = 5) {
    this.mood = 'sleeping'
    this._napDuration = duration
  }

  surprise() {
    this.mood = 'surprised'
    this._surprisedTimer = 0.5
  }

  becomeIdle() {
    this.mood = 'idle'
    this.clearEvent()
  }

  setAccessory(key) {
    this._accessory = key
    this._accessoryTimer = rand(120, 180)
  }

  clearAccessory() {
    this._accessory = null
    this._accessoryTimer = 0
  }

  /** Put on a party hat if today is the given birthday. */
  applyBirthday(month, day) {
    const today = new Date()
    if (month === today.getMonth() + 1 && day === today.getDate()) {
      this.setAccessory('partyhat')
    }
  }

  spawnPanko() {
    if (this.panko?.isActive()) return
    this.panko = new PankoEvent()
    this.panko.start(this)
  }

  setAudioManager(audio) {
    this.audio = audio
  }

  setEducationalMode(enabled) {
    this._educationalMode = enabled
    this._letterIndex = 0
  }

  showLetter(letter) {
    this._displayLetter = letter
    this._displayLetterTimer = 3
  }

  /** Snapshot of internal state for the debug panel. */
  debugState() {
    return {
      mood: this.mood,
      event: this._event,
      accessory: this._accessory,
      educationalMode: this._educationalMode,
      streak: this.bonding.getStreak(),
      effects: this.bonding.getActiveMilestones()
    }
  }

  // ----------------------------------------------------------------- update

  _update(dt) {
    this._updateMood(dt)
    this._updateEvents(dt)
    this._updateAccessory(dt)
    this._updateIdleBehaviour(dt)
    this._updateBonding(dt)

    this.firefly.update(dt)
    this._updatePanko(dt)
    this._particles.update(dt)

    if (this._displayLetter) {
      this._displayLetterTimer -= dt
      if (this._displayLetterTimer <= 0) this._displayLetter = null
    }
  }

  _updateMood(dt) {
    if (this.mood === 'happy') {
      this._happyTimer -= dt
      if (this._happyTimer <= 0) this.mood = 'idle'
    } else if (this.mood === 'surprised') {
      this._surprisedTimer -= dt
      if (this._surprisedTimer <= 0) this.mood = 'happy'
    } else if (this.mood === 'sleeping') {
      this._napDuration -= dt
      if (this._napDuration <= 0) this.mood = 'idle'
    }

    if (this._happyCooldown > 0) this._happyCooldown -= dt

    const happyish = this.mood === 'happy' || this.mood === 'surprised'
    this._moodBlend = happyish
      ? Math.min(1, this._moodBlend + dt * 3)
      : Math.max(0, this._moodBlend - dt * 5)

    if (this.mood === 'idle') {
      this._napTimer -= dt
      if (this._napTimer <= 0) {
        if (Math.random() < 0.3) this.sleep(5)
        this._napTimer = rand(20, 40)
      }
    }
  }

  _updateEvents(dt) {
    if (this.mood === 'idle' && !this._event) {
      this._eventCheckTimer -= dt
      if (this._eventCheckTimer <= 0) {
        if (Math.random() < 0.35) this.triggerRandomEvent()
        this._eventCheckTimer = rand(10, 25)
      }
    }

    if (this._event) {
      this._eventTime += dt
      if (this._eventTime >= EVENT_DURATIONS[this._event]) this.clearEvent()
    }
  }

  _updateAccessory(dt) {
    if (this.mood === 'idle' && !this._event && !this._accessory) {
      this._accessoryCheckTimer -= dt
      if (this._accessoryCheckTimer <= 0) {
        if (Math.random() < 0.05) {
          // 'crown' is reserved for streak rewards
          this.setAccessory(pick([...accessories.keys()].filter(k => k !== 'crown')))
        }
        this._accessoryCheckTimer = rand(10, 25)
      }
    }

    if (this._accessory) {
      this._accessoryTimer -= dt
      if (this._accessoryTimer <= 0) this.clearAccessory()
    }
  }

  _updateIdleBehaviour(dt) {
    // Blink (not while sleeping or during events)
    if (this.mood !== 'sleeping' && !this._event) {
      this._blinkTimer -= dt
      if (this._blinkTimer <= 0) {
        this._isBlinking = true
        const night = isNight()
        this._blinkTimer = night ? rand(4, 10) : rand(3, 5)
        this._blinkDuration = night ? 0.25 : 0.1
      }
      if (this._isBlinking) {
        this._blinkDuration -= dt
        if (this._blinkDuration <= 0) {
          this._isBlinking = false
          this._blinkDuration = 0.1
        }
      }

      this._chirpTimer -= dt
      if (this._chirpTimer <= 0) {
        this.sound.chirp()
        this._chirpTimer = rand(8, 15)
      }
    }

    // Gaze wander (idle only)
    if (this.mood === 'idle' && !this._isBlinking && !this._event) {
      this._lookTimer -= dt
      if (this._lookTimer <= 0) {
        this._lookTargetX = (Math.random() - 0.5) * 3
        this._lookTargetY = (Math.random() - 0.5) * 1.5
        this._lookTimer = rand(2, 5)
      }
      this._lookX += (this._lookTargetX - this._lookX) * dt * 5
      this._lookY += (this._lookTargetY - this._lookY) * dt * 5
    }
  }

  _updateBonding(dt) {
    // Streaks only change when the calendar day does, so check occasionally.
    this._bondingCheckTimer -= dt
    if (this._bondingCheckTimer <= 0) {
      this._bondingCheckTimer = 60
      this._handleBondingResult(this.bonding.checkAndUpdate())
    }

    if (this._bondingCrownTimer > 0) this._bondingCrownTimer -= dt

    // Ambient sparkles, rates are per-frame probabilities at 60fps.
    const frames = dt * 60
    if (this.bonding.hasEffect('sparkles') && Math.random() < 0.15 * frames) {
      this._spawnSparkle(2, 8, 1, 0.8, 1.4)
    }
    if (this.bonding.hasEffect('supreme') && Math.random() < 0.2 * frames) {
      this._spawnSparkle(3, 11, 0.8, 1, 2)
    }
  }

  _spawnSparkle(minDist, maxDist, speed, minLife, maxLife) {
    const angle = Math.random() * Math.PI * 2
    const dist = rand(minDist, maxDist)
    this._particles.spawn(
      CENTER + Math.cos(angle) * dist,
      CENTER + Math.sin(angle) * dist,
      {
        vx: Math.cos(angle) * rand(0.3, 0.3 + speed),
        vy: Math.sin(angle) * rand(0.3, 0.3 + speed) - 0.4,
        life: rand(minLife, maxLife),
        size: rand(0.4, 0.9)
      }
    )
  }

  _handleBondingResult(result) {
    const key = result.milestone?.key
    if (key === 'crown' || key === 'supreme') this._bondingCrownTimer = 300
  }

  _updatePanko(dt) {
    if (this.panko) {
      this.panko.update(dt)
      if (!this.panko.isActive()) {
        this.panko = null
        this._lastPankoTime = this._time
      }
      return
    }

    const quiet = this.mood === 'idle' && !this._event && !this._accessory
    if (quiet && this._time - this._lastPankoTime > 300) {
      this._pankoCheckTimer -= dt
      if (this._pankoCheckTimer <= 0) {
        if (Math.random() < 0.02) this.spawnPanko()
        this._pankoCheckTimer = rand(15, 25)
      }
    }
  }

  _onEventStart(event) {
    if (event === 'sneeze') this.sound.sneeze()
    else if (event === 'glitch') this.sound.glitch()
    else if (event === 'dizzy') this.sound.dizzy()
  }

  // ------------------------------------------------------------------ input

  _handleTap(e) {
    if (e.cancelable) e.preventDefault()
    if (this._happyCooldown > 0) return

    if (this._tryCatchFirefly(e.clientX, e.clientY)) return

    if (this._educationalMode) {
      this._handleEducationalTap()
      return
    }

    this.clearEvent()

    if (this.mood === 'sleeping') {
      this.mood = 'surprised'
      this._surprisedTimer = 0.5
      this._happyTimer = 1.5
      this._happyCooldown = 1.5
      this._moodBlend = 1
      this.sound.surprise()
      this._sparks()
      return
    }

    if (Math.random() < this._tapGlitchChance) {
      this.mood = 'idle'
      this.triggerEvent('glitch')
      this._happyCooldown = 0.5
      this._sparks()
      return
    }

    this.makeHappy()
  }

  _tryCatchFirefly(clientX, clientY) {
    if (!this.firefly.active) return false
    const rect = this.canvas.getBoundingClientRect()
    // The firefly is drawn with the bounce offset but without the sprite offset.
    const x = (clientX - rect.left) / this._scale
    const y = (clientY - rect.top - this._getBounceOffset()) / this._scale
    if (!this.firefly.hit(x, y)) return false

    const { x: fx, y: fy } = this.firefly
    this.firefly.dismiss()
    this.sound.fireflyChirp()
    this._particles.burst(fx, fy, 6, { speed: [1, 3], life: [0.6, 1.0] })
    return true
  }

  _sparks() {
    this._particles.burst(CENTER, CENTER, 8)
  }

  _handleEducationalTap() {
    const letter = LETTERS[this._letterIndex]
    this.showLetter(letter)
    this.audio?.play(letter.toLowerCase())
    this._letterIndex = (this._letterIndex + 1) % LETTERS.length
  }

  // ------------------------------------------------------------------- draw

  _eventProgress() {
    return this._event ? Math.min(1, this._eventTime / EVENT_DURATIONS[this._event]) : 0
  }

  _drawState() {
    const progress = this._eventProgress()
    return {
      mood: this.mood,
      blend: this._moodBlend,
      blink: this._isBlinking,
      lookX: this._lookX,
      lookY: this._lookY,
      napDuration: this.mood === 'sleeping' ? this._napDuration : 0,
      event: this._event,
      eventTime: this._eventTime,
      eventProgress: progress,
      eventBlend: this._event ? (1 - Math.cos(progress * Math.PI)) / 2 : 0,
      surprisedTimer: this.mood === 'surprised' ? this._surprisedTimer : 0,
      time: this._time,
      timePeriod: getPeriod(),
      timeBlend: getBlend(),
      accessory: this._accessory,
      bondingCrown: this._bondingCrownTimer > 0,
      displayLetter: this._displayLetter,
      displayLetterTimer: this._displayLetterTimer,
      antennaPulse: this.bonding.hasEffect('antennaPulse'),
      golden: this.bonding.hasEffect('golden'),
      supreme: this.bonding.hasEffect('supreme'),
      halo: this.bonding.hasEffect('halo') || this.bonding.hasEffect('supreme')
    }
  }

  _draw() {
    const ctx = this.ctx
    const skin = this.skin
    const scale = this._scale
    const bounce = this._getBounceOffset()
    const state = this._drawState()

    ctx.fillStyle = '#2c2c2c'
    ctx.fillRect(0, 0, this._cssWidth, this._cssHeight)

    this._particles.draw(ctx, scale, bounce)

    ctx.save()
    ctx.translate(0, bounce)
    ctx.scale(scale, scale)
    ctx.translate(0, SPRITE_Y_OFFSET)
    this._applyEventTransform(ctx, state)

    skin.drawAura?.(ctx, skin.palette, state, this._time)
    skin.drawAntenna(ctx, skin.palette, state, this._time)
    skin.drawHead(ctx, skin.palette, state, this._time)
    skin.drawEyes(ctx, skin.palette, state, this._time)
    skin.drawAccessory(ctx, skin.palette, state, this._time)
    if (state.bondingCrown) {
      accessories.get('crown')?.draw(ctx, skin.palette, state, this._time)
    }
    skin.drawOverlay?.(ctx, skin.palette, state, this._time)

    ctx.restore()

    this.firefly.draw(ctx, scale, bounce, this._time)
    if (this.panko?.isActive()) {
      this.panko.draw(ctx, scale, SPRITE_Y_OFFSET * scale)
    }
  }

  _applyEventTransform(ctx, state) {
    let angle = 0
    switch (this._event) {
      case 'spin': angle = state.eventProgress * Math.PI * 2; break
      case 'curious': angle = 0.08; break
      case 'confused': angle = -0.05; break
      case 'dizzy': angle = Math.sin(this._eventTime * 30) * 0.05 * (1 - state.eventProgress); break
      default: return
    }
    ctx.translate(CENTER, CENTER)
    ctx.rotate(angle)
    ctx.translate(-CENTER, -CENTER)
  }

  _getBounceOffset() {
    const s = this._scale
    const progress = this._eventProgress()
    const idleOffset = Math.sin(this._time * 1.5) * 1.5 * s

    if (this.mood === 'surprised') {
      return -Math.sin((1 - this._surprisedTimer / 0.5) * Math.PI) * 8 * s
    }

    if (this.mood === 'happy') {
      const t = this._happyTimer
      let happyOffset
      if (t > 1.2) {
        happyOffset = -Math.sin(((t - 1.2) / 0.3) * Math.PI) * 6 * s
      } else {
        happyOffset = -Math.sin(t * 8) * 1.5 * Math.max(0, t / 1.2) * s
      }
      return happyOffset * this._moodBlend + idleOffset * (1 - this._moodBlend)
    }

    switch (this._event) {
      case 'sneeze':
        if (progress < 0.3) return -Math.sin((progress / 0.3) * Math.PI) * 4 * s
        return Math.sin(((progress - 0.3) / 0.7) * Math.PI) * 2 * s * (1 - (progress - 0.3) / 0.7)
      case 'dizzy':
        return Math.sin(this._eventTime * 40) * 3 * s * (1 - progress)
      case 'excited':
        return Math.sin(this._eventTime * 20) * 2 * s * ((1 - Math.cos(progress * Math.PI)) / 2)
    }

    if (this.mood === 'sleeping') {
      return Math.sin(this._time * 0.8) * 0.3 * s
    }

    return idleOffset * (1 - this._moodBlend) + Math.sin(this._time * 3) * 1.5 * this._moodBlend * s
  }
}
