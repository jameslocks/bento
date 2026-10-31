const CENTER = 16
const nextDelay = () => 60 + Math.random() * 30

export class Firefly {
  constructor() {
    this.active = false
    this.timer = 60 + Math.random() * 30
    this.x = CENTER
    this.y = CENTER
    this.angle = 0
    this.speed = 1.5
    this.radius = 12
    this.duration = 8
    this.elapsed = 0
    this._trail = []
  }

  update(dt) {
    if (!this.active) {
      this.timer -= dt
      if (this.timer <= 0) {
        this.active = true
        this.angle = Math.random() * Math.PI * 2
        this.elapsed = 0
      }
      return
    }

    this.elapsed += dt
    this.angle += this.speed * dt
    this.x = CENTER + this.radius * Math.sin(this.angle)
    this.y = CENTER + this.radius * Math.sin(2 * this.angle)

    this._trail.push({ x: this.x, y: this.y })
    if (this._trail.length > 8) this._trail.shift()

    if (this.elapsed >= this.duration) this.dismiss()
  }

  /** True if the grid point (x, y) is within `radius` of the firefly. */
  hit(x, y, radius = 3) {
    return this.active && Math.hypot(this.x - x, this.y - y) < radius
  }

  dismiss() {
    this.active = false
    this.timer = nextDelay()
    this._trail = []
  }

  draw(ctx, scale, offsetY, time) {
    if (!this.active) return

    const bx = this.x * scale
    const by = this.y * scale + offsetY
    const glow = Math.sin(time * 4 + this.angle) * 0.3 + 0.7
    const fadeIn = Math.min(1, this.elapsed / 0.5)
    const fadeOut = Math.min(1, (this.duration - this.elapsed) / 0.5)
    const alpha = glow * fadeIn * fadeOut

    const n = this._trail.length
    for (let i = 0; i < n; i++) {
      const t = this._trail[i]
      ctx.fillStyle = `rgba(100, 255, 150, ${(i / n) * alpha * 0.4})`
      ctx.beginPath()
      ctx.arc(t.x * scale, t.y * scale + offsetY, (0.5 + (i / n) * 1.5) * scale, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = `rgba(100, 255, 150, ${alpha * 0.3})`
    ctx.beginPath()
    ctx.arc(bx, by, 3 * scale, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(180, 255, 200, ${alpha})`
    ctx.beginPath()
    ctx.arc(bx, by, 1.5 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
}
