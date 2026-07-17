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

    // Idle animation state
    this._blinkTimer = 3 + Math.random() * 2
    this._isBlinking = false
    this._blinkDuration = 0.1
    this._chirpTimer = 8 + Math.random() * 7

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
    // Happy state timer
    if (this.mood === 'happy') {
      this._happyTimer -= dt
      if (this._happyTimer <= 0) {
        this.mood = 'idle'
      }
    }
    if (this._happyCooldown > 0) {
      this._happyCooldown -= dt
    }

    // Blink timer
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

    // Autonomous chirp
    this._chirpTimer -= dt
    if (this._chirpTimer <= 0) {
      this.sound.chirp()
      this._chirpTimer = 8 + Math.random() * 7
    }
  }

  _handleTap(e) {
    e.preventDefault()
    if (this._happyCooldown > 0) return

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

    const state = {
      mood: this.mood,
      blink: this._isBlinking,
      time: this._time
    }

    this.skin.drawAntenna(ctx, this.skin.palette, this._time)
    this.skin.drawHead(ctx, this.skin.palette, this._time)
    this.skin.drawEyes(ctx, this.skin.palette, state, this._time)

    ctx.restore()
  }

  _getBounceOffset() {
    if (this.mood === 'happy') {
      // Quick upward bounce that settles
      const t = this._happyTimer
      if (t > 1.2) {
        // Initial jump
        const phase = (t - 1.2) / 0.3
        return -Math.sin(phase * Math.PI) * 6 * this._scale
      }
      // Settling bounce
      return -Math.sin(t * 8) * 1.5 * Math.max(0, t / 1.2) * this._scale
    }
    // Idle gentle float
    return Math.sin(this._time * 1.5) * 1.5 * this._scale
  }

  setSkin(skin) {
    this.skin = skin
  }
}