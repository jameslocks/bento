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
      glitch: 0.3,
      spin: 0.5,
      sneeze: 0.4,
      rainbow: 0.8,
      heart: 1.2
    }

    // Surprised state (wake from sleep)
    this._surprisedTimer = 0

    // Tap handler
    this._onTap = this._handleTap.bind(this)
    this.canvas.addEventListener('click', this._onTap)
    this.canvas.addEventListener('touchstart', this._onTap, { passive: false })
  }

  _resize() {
    const displaySize = Math.min(window.innerWidth, window.innerHeight) * 0.6
    this._scale = Math.max(4, Math.floor(displaySize / this._gridSize))
    const size = this._gridSize * this._scale
    this.canvas.width = size
    this.canvas.height = size
    this.canvas.style.width = size + 'px'
    this.canvas.style.height = size + 'px'
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

    // Surprised state (wake from sleep)
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

    // Update current event
    if (this._event) {
      this._eventTime += dt
      if (this._eventTime >= this._events[this._event]) {
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

    // Nap decision (only when idle for a while)
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

  _handleTap(e) {
    if (e.cancelable) e.preventDefault()
    if (this._happyCooldown > 0) return

    this._event = null
    this._eventTime = 0

    if (this.mood === 'sleeping') {
      this.mood = 'surprised'
      this._surprisedTimer = 0.5
      this._happyTimer = 1.5
      this._happyCooldown = 1.5
      this._moodBlend = 1
      this.sound.surprise()
      return
    }

    this.mood = 'happy'
    this._happyTimer = 1.5
    this._happyCooldown = 1.5
    this.sound.happy()
  }

  _draw() {
    const ctx = this.ctx

    ctx.fillStyle = '#f0e6d3'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    ctx.save()
    ctx.translate(0, this._getBounceOffset())
    ctx.scale(this._scale, this._scale)

    if (this._event === 'spin') {
      const progress = this._eventTime / this._events.spin
      ctx.translate(16, 16)
      ctx.rotate(progress * Math.PI * 2)
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
      surprisedTimer: this.mood === 'surprised' ? this._surprisedTimer : 0,
      time: this._time
    }

    this.skin.drawAntenna(ctx, this.skin.palette, state, this._time)
    this.skin.drawHead(ctx, this.skin.palette, state, this._time)
    this.skin.drawEyes(ctx, this.skin.palette, state, this._time)

    ctx.restore()
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
      return Math.sin((p - 0.3) / 0.7 * Math.PI) * 2 * this._scale
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