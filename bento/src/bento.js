import { accessories } from './accessories.js'
export class Bento {
  constructor(canvas, skin, sound) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.skin = skin
    this.sound = sound

    this._gridSize = 32
    this._scale = 1
    this._resize()

    this._rafId = null
    this._lastTime = 0
    this._time = 0

    // State machine
    this.mood = 'idle'
    this._happyTimer = 0
    this._happyCooldown = 0
    this._moodBlend = 0

    // Idle animation state
    this._blinkTimer = 3 + Math.random() * 2
    this._isBlinking = false
    this._blinkDuration = 0.1
    this._chirpTimer = 8 + Math.random() * 7

    // Gaze movement (idle only)
    this._lookX = 0
    this._lookY = 0
    this._lookTargetX = 0
    this._lookTargetY = 0
    this._lookTimer = 2 + Math.random() * 2

    // Nap state
    this._napTimer = 30 + Math.random() * 30
    this._napDuration = 0

    // Random events
    this._event = null
    this._eventTime = 0
    this._eventCheckTimer = 10 + Math.random() * 15
    this._events = {
      glitch: 0.5,
      spin: 0.8,
      sneeze: 0.6,
      rainbow: 1.2,
      heart: 1.8,
      curious: 2.0,
      excited: 1.2,
      confused: 1.5
    }
    this._dizzyDuration = 2.0

    // Accessory state
    this._accessory = null
    this._accessoryTimer = 0
    this._accessoryCheckTimer = 10 + Math.random() * 15

    // Letter display
    this._displayLetter = null
    this._displayLetterTimer = 0

    // Surprised state (wake from sleep)
    this._surprisedTimer = 0

    // Particles
    this._particles = []

    // Firefly
    this._firefly = {
      active: false,
      timer: 20 + Math.random() * 20,
      x: 16, y: 16,
      angle: 0,
      speed: 1.5,
      radius: 12,
      duration: 8,
      elapsed: 0
    }

    // Tap reaction: 25% chance of spark+glitch instead of happy
    this._tapGlitchChance = 0.25

    // Educational mode
    this._educationalMode = false
    this._letterIndex = 0
    this._letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    this._audio = null

    // Tap handler
    this._onTap = this._handleTap.bind(this)
    this.canvas.addEventListener('click', this._onTap)
    this.canvas.addEventListener('touchstart', this._onTap, { passive: false })
  }

  _resize() {
    const displaySize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8)
    const size = Math.min(displaySize, 640)
    this._scale = Math.max(4, Math.floor(size / this._gridSize))
    const w = size
    const h = Math.round(size * 1.5)
    this.canvas.width = w
    this.canvas.height = h
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
  }

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
    this.canvas.removeEventListener('touchstart', this._onTap)
  }

  _loop(timestamp) {
    const dt = (timestamp - this._lastTime) / 1000
    this._lastTime = timestamp
    this._time += dt

    this._update(dt)
    this._draw()

    this._rafId = requestAnimationFrame((t) => this._loop(t))
  }

  _update(dt) {
    // Happy state
    if (this.mood === 'happy') {
      this._happyTimer -= dt
      if (this._happyTimer <= 0) {
        this.mood = 'idle'
      }
    }

    // Surprised state
    if (this.mood === 'surprised') {
      this._surprisedTimer -= dt
      if (this._surprisedTimer <= 0) {
        this.mood = 'happy'
      }
    }

    // Sleeping state
    if (this.mood === 'sleeping') {
      this._napDuration -= dt
      if (this._napDuration <= 0) {
        this.mood = 'idle'
      }
    }

    // Cooldown
    if (this._happyCooldown > 0) {
      this._happyCooldown -= dt
    }

    // Mood blend
    if (this.mood === 'happy' || this.mood === 'surprised') {
      this._moodBlend = Math.min(1, this._moodBlend + dt * 3)
    } else {
      this._moodBlend = Math.max(0, this._moodBlend - dt * 5)
    }

    // Random events during idle
    if (this.mood === 'idle' && !this._event) {
      this._eventCheckTimer -= dt
      if (this._eventCheckTimer <= 0) {
        if (Math.random() < 0.35) {
          const keys = Object.keys(this._events)
          this._event = keys[Math.floor(Math.random() * keys.length)]
          this._eventTime = 0
          this._onEventStart(this._event)
        }
        this._eventCheckTimer = 10 + Math.random() * 15
      }
    }

    // Accessory random events (very rare)
    if (this.mood === 'idle' && !this._event && !this._accessory) {
      this._accessoryCheckTimer -= dt
      if (this._accessoryCheckTimer <= 0) {
        if (Math.random() < 0.05) {
          const keys = Array.from(accessories.keys())
          this._setAccessory(keys[Math.floor(Math.random() * keys.length)])
        }
        this._accessoryCheckTimer = 10 + Math.random() * 15
      }
    }

    // Update accessory timer
    if (this._accessory) {
      this._accessoryTimer -= dt
      if (this._accessoryTimer <= 0) {
        this._accessory = null
        this._accessoryTimer = 0
      }
    }

    // Update current event
    if (this._event) {
      this._eventTime += dt
      if (this._eventTime >= (this._events[this._event] ?? this._dizzyDuration)) {
        this._event = null
        this._eventTime = 0
      }
    }

    // Blink (not when sleeping or during events)
    if (this.mood !== 'sleeping' && !this._event) {
      this._blinkTimer -= dt
      if (this._blinkTimer <= 0) {
        this._isBlinking = true
        this._blinkTimer = 3 + Math.random() * 2
      }
      if (this._isBlinking) {
        this._blinkDuration -= dt
        if (this._blinkDuration <= 0) {
          this._isBlinking = false
          this._blinkDuration = 0.1
        }
      }
    }

    // Gaze movement (idle only)
    if (this.mood === 'idle' && !this._isBlinking && !this._event) {
      this._lookTimer -= dt
      if (this._lookTimer <= 0) {
        this._lookTargetX = (Math.random() - 0.5) * 3
        this._lookTargetY = (Math.random() - 0.5) * 1.5
        this._lookTimer = 2 + Math.random() * 3
      }
      this._lookX += (this._lookTargetX - this._lookX) * dt * 5
      this._lookY += (this._lookTargetY - this._lookY) * dt * 5
    }

    // Autonomous chirp (not while sleeping)
    if (this.mood !== 'sleeping' && !this._event) {
      this._chirpTimer -= dt
      if (this._chirpTimer <= 0) {
        this.sound.chirp()
        this._chirpTimer = 8 + Math.random() * 7
      }
    }

    // Nap decision
    if (this.mood === 'idle') {
      this._napTimer -= dt
      if (this._napTimer <= 0) {
        if (Math.random() < 0.3) {
          this.mood = 'sleeping'
          this._napDuration = 5
        }
        this._napTimer = 20 + Math.random() * 20
      }
    }

    // Firefly
    this._firefly.timer -= dt
    if (!this._firefly.active && this._firefly.timer <= 0) {
      this._firefly.active = true
      this._firefly.angle = Math.random() * Math.PI * 2
      this._firefly.elapsed = 0
    }
    if (this._firefly.active) {
      this._firefly.elapsed += dt
      this._firefly.angle += this._firefly.speed * dt
      this._firefly.x = 16 + Math.cos(this._firefly.angle) * this._firefly.radius
      this._firefly.y = 16 + Math.sin(this._firefly.angle) * (this._firefly.radius * 0.6)
      if (this._firefly.elapsed >= this._firefly.duration) {
        this._firefly.active = false
        this._firefly.timer = 20 + Math.random() * 20
      }
    }

    // Update particles
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i]
      p.x += p.vx * dt * 60
      p.y += p.vy * dt * 60
      p.life -= dt
      p.alpha = Math.max(0, p.life / p.maxLife)
      p.size += dt * 0.3
      if (p.life <= 0) {
        this._particles.splice(i, 1)
      }
    }

    this._updateLetterDisplay(dt)
  }

  _onEventStart(event) {
    switch (event) {
      case 'sneeze':
        this.sound.sneeze()
        break
      case 'glitch':
        this.sound.glitch()
        break
    }
  }

  _spawnParticle(x, y, opts = {}) {
    this._particles.push({
      x, y,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      life: opts.life || 1,
      maxLife: opts.life || 1,
      size: opts.size || 0.5,
      alpha: 1,
      type: opts.type || 'dot'
    })
  }

  _spawnSparks() {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2
      this._spawnParticle(16, 16, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5 + Math.random() * 1.0,
        size: 0.3 + Math.random() * 0.3,
        type: 'spark'
      })
    }
  }

  _handleTap(e) {
    if (e.cancelable) e.preventDefault()
    if (this._happyCooldown > 0) return

    if (this._educationalMode) {
      this._handleEducationalTap()
      return
    }

    this._event = null
    this._eventTime = 0

    if (this.mood === 'sleeping') {
      this.mood = 'surprised'
      this._surprisedTimer = 0.5
      this._happyTimer = 1.5
      this._happyCooldown = 1.5
      this._moodBlend = 1
      this.sound.surprise()
      this._spawnSparks()
      return
    }

    // Random chance of spark+glitch instead of happy
    if (Math.random() < this._tapGlitchChance) {
      this.mood = 'idle'
      this._event = 'glitch'
      this._eventTime = 0
      this._happyCooldown = 0.5
      this.sound.glitch()
      this._spawnSparks()
      return
    }

    this.mood = 'happy'
    this._happyTimer = 1.5
    this._happyCooldown = 1.5
    this.sound.happy()
  }

  triggerDizzy() {
    this.mood = 'idle'
    this._event = 'dizzy'
    this._eventTime = 0
    this.sound.dizzy()
  }

  setAudioManager(audio) {
    this._audio = audio
  }

  setEducationalMode(enabled) {
    this._educationalMode = enabled
    this._letterIndex = 0
  }

  _handleEducationalTap() {
    const letter = this._letters[this._letterIndex]
    this.showLetter(letter)
    if (this._audio) {
      this._audio.play(letter.toLowerCase())
    }
    this._letterIndex = (this._letterIndex + 1) % this._letters.length
  }

  _checkBirthday(settings) {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const birthMonth = parseInt(settings.get('birthMonth'), 10)
    const birthDay = parseInt(settings.get('birthDay'), 10)
    if (birthMonth === month && birthDay === day) {
      this._setAccessory('partyhat')
    }
  }

  _setAccessory(key) {
    this._accessory = key
    this._accessoryTimer = 120 + Math.random() * 60
  }

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

  _draw() {
    const ctx = this.ctx

    ctx.fillStyle = '#2c2c2c'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this._drawParticles(ctx)

    ctx.save()
    ctx.translate(0, this._getBounceOffset())
    ctx.scale(this._scale, this._scale)
    ctx.translate(0, 8)

    if (this._event === 'spin') {
      const progress = this._eventTime / this._events.spin
      ctx.translate(16, 16)
      ctx.rotate(progress * Math.PI * 2)
      ctx.translate(-16, -16)
    }

    if (this._event === 'curious') {
      ctx.translate(16, 16)
      ctx.rotate(0.08)
      ctx.translate(-16, -16)
    }

    if (this._event === 'confused') {
      ctx.translate(16, 16)
      ctx.rotate(-0.05)
      ctx.translate(-16, -16)
    }

    if (this._event === 'dizzy') {
      const p = this._eventTime / this._dizzyDuration
      const decay = 1 - p
      ctx.translate(16, 16)
      ctx.rotate(Math.sin(this._eventTime * 30) * 0.05 * decay)
      ctx.translate(-16, -16)
    }

    const state = {
      mood: this.mood,
      blend: this._moodBlend,
      blink: this._isBlinking,
      lookX: this._lookX,
      lookY: this._lookY,
      napDuration: this.mood === 'sleeping' ? this._napDuration : 0,
      event: this._event,
      eventTime: this._eventTime,
      eventBlend: this._event ? (1 - Math.cos((this._eventTime / (this._events[this._event] ?? this._dizzyDuration)) * Math.PI)) / 2 : 0,
      surprisedTimer: this.mood === 'surprised' ? this._surprisedTimer : 0,
      time: this._time,
      accessory: this._accessory,
      displayLetter: this._displayLetter,
      displayLetterTimer: this._displayLetterTimer,
    }

    this.skin.drawAntenna(ctx, this.skin.palette, state, this._time)
    this.skin.drawHead(ctx, this.skin.palette, state, this._time)
    this.skin.drawEyes(ctx, this.skin.palette, state, this._time)
    this.skin.drawAccessory(ctx, this.skin.palette, state, this._time)

    if (this.mood === 'sleeping') {
      const bob = Math.sin(this._time * 2) * 0.6
      const pulse = Math.sin(this._time * 2.5) * 0.15 + 0.85
      ctx.fillStyle = `rgba(100, 200, 255, ${0.4 + pulse * 0.2})`
      ctx.font = `${Math.round(3 * pulse)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('z', 16.5 + bob * 0.2, 1 + bob)
    }

    ctx.restore()

    this._drawFirefly(ctx)
  }

  _drawParticles(ctx) {
    for (const p of this._particles) {
      const sx = p.x * this._scale
      const sy = p.y * this._scale + this._getBounceOffset()

      if (p.type === 'spark') {
        const colors = ['#ffd54f', '#ff4081', '#4fc3f7', '#69f0ae']
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(sx, sy, p.size * this._scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
  }

  _drawFirefly(ctx) {
    if (!this._firefly.active) return

    const s = this._scale
    const bx = this._firefly.x * s
    const by = this._firefly.y * s + this._getBounceOffset()
    const glow = Math.sin(this._time * 4 + this._firefly.angle) * 0.3 + 0.7
    const fadeIn = Math.min(1, this._firefly.elapsed / 0.5)
    const fadeOut = Math.min(1, (this._firefly.duration - this._firefly.elapsed) / 0.5)
    const alpha = glow * fadeIn * fadeOut

    // Glow
    ctx.fillStyle = `rgba(100, 255, 150, ${alpha * 0.3})`
    ctx.beginPath()
    ctx.arc(bx, by, 3 * s, 0, Math.PI * 2)
    ctx.fill()

    // Core
    ctx.fillStyle = `rgba(180, 255, 200, ${alpha})`
    ctx.beginPath()
    ctx.arc(bx, by, 1.5 * s, 0, Math.PI * 2)
    ctx.fill()
  }

  _getBounceOffset() {
    const idleOffset = Math.sin(this._time * 1.5) * 1.5 * this._scale

    if (this.mood === 'surprised') {
      return -Math.sin((1 - this._surprisedTimer / 0.5) * Math.PI) * 8 * this._scale
    }

    if (this.mood === 'happy') {
      const t = this._happyTimer
      let happyOffset
      if (t > 1.2) {
        const phase = (t - 1.2) / 0.3
        happyOffset = -Math.sin(phase * Math.PI) * 6 * this._scale
      } else {
        happyOffset = -Math.sin(t * 8) * 1.5 * Math.max(0, t / 1.2) * this._scale
      }
      return happyOffset * this._moodBlend + idleOffset * (1 - this._moodBlend)
    }

    if (this._event === 'sneeze') {
      const p = this._eventTime / this._events.sneeze
      if (p < 0.3) return -Math.sin(p / 0.3 * Math.PI) * 4 * this._scale
      return Math.sin((p - 0.3) / 0.7 * Math.PI) * 2 * this._scale * (1 - (p - 0.3) / 0.7)
    }

    if (this._event === 'dizzy') {
      const p = this._eventTime / this._dizzyDuration
      const decay = 1 - p
      return Math.sin(this._eventTime * 40) * 3 * this._scale * decay
    }

    if (this._event === 'excited') {
      const blend = (1 - Math.cos((this._eventTime / this._events.excited) * Math.PI)) / 2
      return Math.sin(this._eventTime * 20) * 2 * this._scale * blend
    }

    if (this.mood === 'sleeping') {
      return Math.sin(this._time * 0.8) * 0.3 * this._scale
    }

    return idleOffset * (1 - this._moodBlend) + Math.sin(this._time * 3) * 1.5 * this._moodBlend * this._scale
  }

  setSkin(skin) {
    this.skin = skin
  }
}