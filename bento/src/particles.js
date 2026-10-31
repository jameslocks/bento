const COLORS = ['#ffd54f', '#ff4081', '#4fc3f7', '#69f0ae']

export class ParticleSystem {
  constructor() {
    this._particles = []
  }

  spawn(x, y, opts = {}) {
    const life = opts.life ?? 1
    this._particles.push({
      x, y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      life,
      maxLife: life,
      size: opts.size ?? 0.5,
      alpha: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    })
  }

  /** Spawn `count` particles flying outward from (x, y). */
  burst(x, y, count, { speed = [1, 3], life = [1.5, 2.5], size = [0.3, 0.6] } = {}) {
    const range = ([min, max]) => min + Math.random() * (max - min)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const v = range(speed)
      this.spawn(x, y, {
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: range(life),
        size: range(size)
      })
    }
  }

  update(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i]
      p.x += p.vx * dt * 60
      p.y += p.vy * dt * 60
      p.life -= dt
      p.alpha = Math.max(0, p.life / p.maxLife)
      p.size += dt * 0.3
      if (p.life <= 0) this._particles.splice(i, 1)
    }
  }

  draw(ctx, scale, offsetY) {
    for (const p of this._particles) {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.arc(p.x * scale, p.y * scale + offsetY, p.size * scale, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
