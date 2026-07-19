const STORAGE_KEY = 'bento:pankoData'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { visitCount: 0, lastVisit: null }
  } catch { return { visitCount: 0, lastVisit: null } }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export class PankoEvent {
  constructor() {
    this._data = loadData()
    this.active = false
    this.x = 0; this.y = 0
    this.targetX = 0; this.targetY = 0
    this.phase = 'entering'
    this.phaseTimer = 0
    this.speed = 0
    this.eyeShape = 'neutral'
    this.eyeTimer = 0
    this.antennaBlink = false
    this.blinkTimer = 0
    this.rotation = 0
    this.visitCount = this._data.visitCount
    this._bento = null
    this._bumped = false
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

    // Determine behavior phase
    if (this.visitCount <= 2) {
      this.speed = 1.5
      // Enter from random edge
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 16; this.targetY = 16
    } else if (this.visitCount <= 5) {
      this.speed = 2
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 22; this.targetY = 16
    } else if (this.visitCount <= 10) {
      this.speed = 3
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 16; this.targetY = 16
    } else {
      this.speed = 4
      const edge = Math.floor(Math.random() * 4)
      if (edge === 0) { this.x = -5; this.y = 16 }
      else if (edge === 1) { this.x = 37; this.y = 16 }
      else if (edge === 2) { this.x = 16; this.y = -5 }
      else { this.x = 16; this.y = 37 }
      this.targetX = 10; this.targetY = 16
    }

    if (bento && bento.sound && bento.sound.panko) {
      bento.sound.panko()
    }
    bento?.triggerEvent('curious')
  }

  update(dt) {
    if (!this.active) return

    this.phaseTimer += dt
    this.blinkTimer += dt
    if (this.blinkTimer > 0.3) {
      this.antennaBlink = !this.antennaBlink
      this.blinkTimer = 0
    }

    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (this.phase === 'entering') {
      if (dist < 0.5) {
        this.x = this.targetX
        this.y = this.targetY
        if (this.visitCount <= 2) {
          this.phase = 'pause'
          this.phaseTimer = 0
          this.eyeShape = 'neutral'
        } else if (this.visitCount <= 5) {
          this.phase = 'circling'
          this.phaseTimer = 0
          this.eyeShape = 'happy'
          this._orbitAngle = 0
        } else if (this.visitCount <= 10) {
          this.phase = 'bump'
          this.phaseTimer = 0
          this.eyeShape = 'happy'
        } else {
          this.phase = 'circling'
          this.phaseTimer = 0
          this.eyeShape = 'suspicious'
          this._orbitAngle = 0
          this._orbitCount = 0
        }
      } else {
        this.x += (dx / dist) * this.speed * dt * 60
        this.y += (dy / dist) * this.speed * dt * 60
      }
    }

    if (this.phase === 'pause') {
      if (this.phaseTimer > 2) {
        this.phase = 'exiting'
        this.phaseTimer = 0
        this.eyeShape = 'neutral'
        const edges = [[-5, 16], [37, 16], [16, -5], [16, 37]]
        const e = edges[Math.floor(Math.random() * 4)]
        this.targetX = e[0]
        this.targetY = e[1]
      }
    }

    if (this.phase === 'circling') {
      this._orbitAngle += dt * 2
      this.x = 16 + 6 * Math.cos(this._orbitAngle)
      this.y = 16 + 6 * Math.sin(this._orbitAngle)
      if (this._orbitAngle > Math.PI * 2) {
        if (this.visitCount > 10) {
          this._orbitCount = (this._orbitCount || 0) + 1
          if (this._orbitCount >= 2) {
            this.phase = 'bump'
            this.phaseTimer = 0
            this.eyeShape = 'happy'
            this._orbitAngle = 0
          } else {
            this._orbitAngle = 0
            this.eyeTimer = 0
          }
        } else {
          this.phase = 'exiting'
          this.phaseTimer = 0
          this.eyeShape = 'neutral'
          const edges = [[-5, 16], [37, 16], [16, -5], [16, 37]]
          const e = edges[Math.floor(Math.random() * 4)]
          this.targetX = e[0]
          this.targetY = e[1]
        }
      }
      this.eyeTimer += dt
      if (this.eyeTimer > 1) {
        this.eyeShape = this.eyeShape === 'happy' ? 'neutral' : 'happy'
        this.eyeTimer = 0
      }
    }

    if (this.phase === 'bump') {
      if (this.phaseTimer < 0.5) {
        this.x = 15; this.y = 16
        if (!this._bumped) {
          this._bumped = true
          this._bento?.triggerEvent('confused')
        }
      } else if (this.phaseTimer < 1.5) {
        this.rotation += dt * 6
        this.eyeShape = 'happy'
      } else {
        this.phase = 'exiting'
        this.phaseTimer = 0
        this.eyeShape = 'neutral'
        const edges = [[-5, 16], [37, 16], [16, -5], [16, 37]]
        const e = edges[Math.floor(Math.random() * 4)]
        this.targetX = e[0]
        this.targetY = e[1]
      }
    }

    if (this.phase === 'exiting') {
      if (dist < 0.5) {
        this.active = false
      } else {
        this.x += (dx / dist) * this.speed * dt * 60
        this.y += (dy / dist) * this.speed * dt * 60
      }
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