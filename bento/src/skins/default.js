import { accessories } from '../accessories.js'
export const defaultSkin = {
  name: 'Default',
  palette: {
    head: '#ffffff',
    visor: '#1a1a2e',
    eye: '#4fc3f7',
    cheek: '#ff8a80',
    antenna: '#aaaaaa',
    glow: '#ffd54f'
  },

  drawHead(ctx, palette, state, time) {
    const cx = 16
    const cy = 16

    const hw = 28
    const hh = 24
    const rx = 4
    const x = cx - hw / 2
    const y = cy - hh / 2

    ctx.fillStyle = palette.head
    ctx.beginPath()
    ctx.moveTo(x + rx, y)
    ctx.lineTo(x + hw - rx, y)
    ctx.quadraticCurveTo(x + hw, y, x + hw, y + rx)
    ctx.lineTo(x + hw, y + hh - rx)
    ctx.quadraticCurveTo(x + hw, y + hh, x + hw - rx, y + hh)
    ctx.lineTo(x + rx, y + hh)
    ctx.quadraticCurveTo(x, y + hh, x, y + hh - rx)
    ctx.lineTo(x, y + rx)
    ctx.quadraticCurveTo(x, y, x + rx, y)
    ctx.closePath()
    ctx.fill()

    const vx = cx - 10
    const vy = cy - 6
    const vw = 20
    const vh = 12

    if (state && state.event === 'rainbow') {
      const hue = (state.eventTime / 1.2) * 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.globalAlpha = 0.3 + state.eventBlend * 0.7
    } else {
      ctx.fillStyle = palette.visor
    }

    ctx.beginPath()
    ctx.roundRect(vx, vy, vw, vh, 2)
    ctx.fill()
    if (state && state.event === 'rainbow') ctx.globalAlpha = 1
  },

  drawEyes(ctx, palette, state, time) {
    const cx = 16
    const cy = 16
    const eyeY = cy + 1
    const blend = state.blend || (state.mood === 'happy' ? 1 : 0)

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(6, 10, 20, 12, 2)
    ctx.clip()

    // Glitch — scramble eye positions rapidly
    if (state.event === 'glitch') {
      const scramble = Math.sin(state.eventTime * 80) * 6 * state.eventBlend
      const scrambleY = Math.cos(state.eventTime * 60) * 3 * state.eventBlend
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4 + scramble, eyeY + scrambleY, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4 - scramble, eyeY - scrambleY, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Static lines
      for (let i = 0; i < 4; i++) {
        const sy = 10 + Math.sin(state.eventTime * 100 + i * 2) * 6
        if (Math.random() > 0.4) {
          ctx.fillStyle = `rgba(255,255,255,${(0.2 + Math.random() * 0.3) * state.eventBlend})`
          ctx.fillRect(6, sy, 20, 1 + Math.random() * 2)
        }
      }
    } else if (state.event === 'dizzy') {
      const p = state.eventTime / 2.0
      const orbitR = 2.5
      const angle = p * Math.PI * 4
      const decay = 1 - p

      // Donut trail
      ctx.strokeStyle = `rgba(79, 195, 247, ${0.3 * decay})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, orbitR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, orbitR, 0, Math.PI * 2)
      ctx.stroke()

      // Eye dots
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4 + Math.cos(angle) * orbitR, eyeY + Math.sin(angle) * orbitR, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4 + Math.cos(angle + Math.PI) * orbitR, eyeY + Math.sin(angle + Math.PI) * orbitR, 1.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (state.mood === 'sleeping') {
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY + 1, 2.5, Math.PI, 0, true)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY + 1, 2.5, Math.PI, 0, true)
      ctx.stroke()
    } else if (state.mood === 'surprised') {
      const p = state.surprisedTimer / 0.5
      const eyeR = 3.5 - p * 1.5
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, eyeR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, eyeR, 0, Math.PI * 2)
      ctx.fill()
    } else if (state.event === 'sneeze') {
      const p = state.eventTime / 0.6
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1.2
      if (p < 0.3) {
        ctx.beginPath()
        ctx.arc(cx - 4, eyeY + 2, 3.5, Math.PI * 0.7, Math.PI * 0.3, true)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx + 4, eyeY + 2, 3.5, Math.PI * 0.7, Math.PI * 0.3, true)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(cx - 4, eyeY, 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + 4, eyeY, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (state.event === 'heart') {
      ctx.fillStyle = '#ff4081'
      ctx.globalAlpha = state.eventBlend
      this._drawHeart(ctx, cx - 4, eyeY, 2.5 * state.eventBlend)
      this._drawHeart(ctx, cx + 4, eyeY, 2.5 * state.eventBlend)
      ctx.globalAlpha = 1
    } else if (state.event === 'curious') {
      const t = state.eventTime / 2.0
      const lx = (state.lookX || 0) * state.eventBlend
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4 + lx, eyeY - 1 - t * 0.5, 1.5 + state.eventBlend * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4 + lx, eyeY - 1 - t * 0.5, 1.5 + state.eventBlend * 0.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (state.event === 'excited') {
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, 1.5 + state.eventBlend * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, 1.5 + state.eventBlend * 0.3, 0, Math.PI * 2)
      ctx.fill()
      const sparkle = Math.sin(state.eventTime * 15) > 0.5
      if (sparkle) {
        ctx.fillStyle = `rgba(255,255,255,${0.9 * state.eventBlend})`
        ctx.beginPath()
        ctx.arc(cx - 3, eyeY - 1, 0.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + 5, eyeY - 1, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (state.event === 'confused') {
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, 1.5 + state.eventBlend * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 5, eyeY + 1, 1.2 * state.eventBlend + 0.3, 0, Math.PI * 2)
      ctx.fill()
    } else if (state.blink && blend < 0.5) {
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx - 5.5 + (state.lookX || 0), eyeY)
      ctx.lineTo(cx - 2.5 + (state.lookX || 0), eyeY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 2.5 + (state.lookX || 0), eyeY)
      ctx.lineTo(cx + 5.5 + (state.lookX || 0), eyeY)
      ctx.stroke()
    } else {
      const eyeR = 1.5 + blend * 1.0
      const lx = state.lookX || 0
      const ly = state.lookY || 0

      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4 + lx, eyeY + ly, eyeR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4 + lx, eyeY + ly, eyeR, 0, Math.PI * 2)
      ctx.fill()

      if (blend > 0.1) {
        ctx.fillStyle = palette.cheek
        ctx.globalAlpha = blend
        ctx.beginPath()
        ctx.arc(cx - 7, eyeY + 3, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + 7, eyeY + 3, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    ctx.restore()
  },

  _drawHeart(ctx, x, y, size) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(size / 2.5, size / 2.5)
    ctx.beginPath()
    ctx.moveTo(0, 1.5)
    ctx.bezierCurveTo(-2.5, -1.5, -5, 0.5, 0, 3.5)
    ctx.bezierCurveTo(5, 0.5, 2.5, -1.5, 0, 1.5)
    ctx.fill()
    ctx.restore()
  },

  drawAntenna(ctx, palette, state, time) {
    const cx = 16
    const topY = 4

    ctx.strokeStyle = palette.antenna
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, topY + 3)
    ctx.lineTo(cx, topY)
    ctx.stroke()

    const isSurprised = state && state.mood === 'surprised'
    const glow = isSurprised ? 1 : Math.sin(time * 3) * 0.3 + 0.7

    ctx.fillStyle = palette.glow
    ctx.globalAlpha = glow
    ctx.beginPath()
    ctx.arc(cx, topY, isSurprised ? 2.5 : 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  },

  drawAccessory(ctx, palette, state, time) {
    if (!state.accessory) return
    const acc = accessories.get(state.accessory)
    if (acc) {
      acc.draw(ctx, palette, state, time)
    }
  }
}