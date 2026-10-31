const STORAGE_KEY = 'bento:pankoData'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { visitCount: 0, lastVisit: null }
  } catch { return { visitCount: 0, lastVisit: null } }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* storage unavailable */ }
}

const OFFSCREEN_POINTS = [[-5, 16], [37, 16], [16, -5], [16, 37]]

const randomEdge = () => OFFSCREEN_POINTS[Math.floor(Math.random() * OFFSCREEN_POINTS.length)]

/**
 * How Panko behaves as it gets to know Bento. The first stage whose `maxVisits`
 * is >= the visit count applies. After arriving at `target`, Panko runs
 * `arrival`: 'pause' | 'circle' | 'bump'. Circling `orbits` times (then exits,
 * or bumps if `bumpAfter`).
 */
const STAGES = [
  { maxVisits: 2, speed: 1.5, target: [16, 16], arrival: 'pause', eyes: 'neutral' },
  { maxVisits: 5, speed: 2, target: [22, 16], arrival: 'circle', eyes: 'happy', orbits: 1 },
  { maxVisits: 10, speed: 3, target: [16, 16], arrival: 'bump', eyes: 'happy' },
  { maxVisits: Infinity, speed: 4, target: [10, 16], arrival: 'circle', eyes: 'suspicious', orbits: 2, bumpAfter: true }
]

const stageFor = (visits) => STAGES.find(s => visits <= s.maxVisits)

export class PankoEvent {
  constructor() {
    this._data = loadData()
    this.active = false
    this.x = 0
    this.y = 0
    this.targetX = 0
    this.targetY = 0
    this.phase = 'entering'
    this.phaseTimer = 0
    this.speed = 0
    this.eyeShape = 'neutral'
    this.eyeTimer = 0
    this.antennaBlink = false
    this.blinkTimer = 0
    this.rotation = 0
    this.visitCount = this._data.visitCount
    this._stage = stageFor(this.visitCount + 1)
    this._bento = null
    this._bumped = false
    this._orbitAngle = 0
    this._orbitCount = 0
  }

  start(bento) {
    this._bento = bento
    this.active = true
    this.phase = 'entering'
    this.phaseTimer = 0
    this.rotation = 0
    this.eyeShape = 'neutral'
    this._bumped = false

    this._data.visitCount++
    this._data.lastVisit = new Date().toISOString().slice(0, 10)
    saveData(this._data)
    this.visitCount = this._data.visitCount

    const stage = this._stage = stageFor(this.visitCount)
    this.speed = stage.speed
    ;[this.x, this.y] = randomEdge()
    ;[this.targetX, this.targetY] = stage.target

    bento?.sound?.panko?.()
    bento?.triggerEvent('curious')
  }

  _enter(phase, eyes = this.eyeShape) {
    this.phase = phase
    this.phaseTimer = 0
    this.eyeShape = eyes
  }

  _exit() {
    this._enter('exiting', 'neutral')
    ;[this.targetX, this.targetY] = randomEdge()
  }

  _arrive() {
    const stage = this._stage
    this.x = this.targetX
    this.y = this.targetY
    this._orbitAngle = 0
    this._orbitCount = 0

    if (stage.arrival === 'pause') this._enter('pause', stage.eyes)
    else if (stage.arrival === 'circle') this._enter('circling', stage.eyes)
    else this._enter('bump', stage.eyes)
  }

  _moveToward(dt) {
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.hypot(dx, dy)
    if (dist >= 0.5) {
      this.x += (dx / dist) * this.speed * dt * 60
      this.y += (dy / dist) * this.speed * dt * 60
    }
    return dist
  }

  update(dt) {
    if (!this.active) return

    this.phaseTimer += dt
    this.blinkTimer += dt
    if (this.blinkTimer > 0.3) {
      this.antennaBlink = !this.antennaBlink
      this.blinkTimer = 0
    }

    switch (this.phase) {
      case 'entering':
        if (this._moveToward(dt) < 0.5) this._arrive()
        break

      case 'pause':
        if (this.phaseTimer > 2) this._exit()
        break

      case 'circling':
        this._updateCircling(dt)
        break

      case 'bump':
        this._updateBump(dt)
        break

      case 'exiting':
        if (this._moveToward(dt) < 0.5) this.active = false
        break
    }
  }

  _updateCircling(dt) {
    this._orbitAngle += dt * 2
    this.x = 16 + 6 * Math.cos(this._orbitAngle)
    this.y = 16 + 6 * Math.sin(this._orbitAngle)

    this.eyeTimer += dt
    if (this.eyeTimer > 1) {
      this.eyeShape = this.eyeShape === 'happy' ? 'neutral' : 'happy'
      this.eyeTimer = 0
    }

    if (this._orbitAngle <= Math.PI * 2) return
    this._orbitAngle = 0
    this._orbitCount++
    if (this._orbitCount < this._stage.orbits) {
      this.eyeTimer = 0
    } else if (this._stage.bumpAfter) {
      this._enter('bump', 'happy')
    } else {
      this._exit()
    }
  }

  _updateBump(dt) {
    if (this.phaseTimer < 0.5) {
      this.x = 15
      this.y = 16
      if (!this._bumped) {
        this._bumped = true
        this._bento?.triggerEvent('confused')
      }
    } else if (this.phaseTimer < 1.5) {
      this.rotation += dt * 6
      this.eyeShape = 'happy'
    } else {
      this._exit()
    }
  }

  draw(ctx, scale, bounceOffset) {
    if (!this.active) return

    const s = scale
    const px = this.x * s
    const py = this.y * s + bounceOffset

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(this.rotation)
    ctx.translate(-px, -py)

    // Body
    ctx.fillStyle = '#ff8a65'
    ctx.strokeStyle = '#ffd54f'
    ctx.lineWidth = Math.max(1, 0.8 * s)
    ctx.beginPath()
    ctx.arc(px, py, 4 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Antenna
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = Math.max(1, 1 * s)
    ctx.beginPath()
    ctx.moveTo(px, py - 4 * s)
    ctx.lineTo(px, py - 6 * s)
    ctx.stroke()

    ctx.fillStyle = this.antennaBlink ? '#ffd54f' : '#ffffff'
    ctx.beginPath()
    ctx.arc(px, py - 6.5 * s, 1 * s, 0, Math.PI * 2)
    ctx.fill()

    // Eye
    if (this.eyeShape === 'neutral') {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 1.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 0.8 * s, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.eyeShape === 'happy') {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = Math.max(1, 1 * s)
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 1 * s, 1.5 * s, Math.PI, 0)
      ctx.stroke()
    } else if (this.eyeShape === 'suspicious') {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 1.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.arc(px - 1.5 * s, py - 0.5 * s, 0.5 * s, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  isActive() {
    return this.active
  }
}