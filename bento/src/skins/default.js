import { accessories } from '../accessories.js'
const CX = 16
const CY = 16
const EYE_Y = CY + 1
const EYE_DX = 4

function dot(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

/** Draw a filled dot in each eye socket, with optional per-eye offsets. */
function eyeDots(ctx, color, r, { left = [0, 0], right = [0, 0] } = {}) {
  ctx.fillStyle = color
  dot(ctx, CX - EYE_DX + left[0], EYE_Y + left[1], r)
  dot(ctx, CX + EYE_DX + right[0], EYE_Y + right[1], r)
}

function drawHeart(ctx, x, y, size) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 2.5, size / 2.5)
  ctx.beginPath()
  ctx.moveTo(0, 1.5)
  ctx.bezierCurveTo(-2.5, -1.5, -5, 0.5, 0, 3.5)
  ctx.bezierCurveTo(5, 0.5, 2.5, -1.5, 0, 1.5)
  ctx.fill()
  ctx.restore()
}

function eyeBlend(s) {
  return s.blend || (s.mood === 'happy' ? 1 : 0)
}

/**
 * Eye renderers in priority order: the first whose `when` matches the state wins.
 */
const EYE_RENDERERS = [
  {
    when: s => s.event === 'glitch',
    draw(ctx, palette, s) {
      const scramble = Math.sin(s.eventTime * 80) * 6 * s.eventBlend
      const scrambleY = Math.cos(s.eventTime * 60) * 3 * s.eventBlend
      eyeDots(ctx, palette.eye, 1.5, {
        left: [scramble, scrambleY],
        right: [-scramble, -scrambleY]
      })
      // Static lines
      for (let i = 0; i < 4; i++) {
        const sy = 10 + Math.sin(s.eventTime * 100 + i * 2) * 6
        if (Math.random() > 0.4) {
          ctx.fillStyle = `rgba(255,255,255,${(0.2 + Math.random() * 0.3) * s.eventBlend})`
          ctx.fillRect(6, sy, 20, 1 + Math.random() * 2)
        }
      }
    }
  },
  {
    when: s => s.event === 'dizzy',
    draw(ctx, palette, s) {
      const orbitR = 2.5
      const angle = s.eventProgress * Math.PI * 4
      const decay = 1 - s.eventProgress

      ctx.strokeStyle = `rgba(79, 195, 247, ${0.3 * decay})`
      ctx.lineWidth = 0.5
      for (const dx of [-EYE_DX, EYE_DX]) {
        ctx.beginPath()
        ctx.arc(CX + dx, EYE_Y, orbitR, 0, Math.PI * 2)
        ctx.stroke()
      }
      eyeDots(ctx, palette.eye, 1.5, {
        left: [Math.cos(angle) * orbitR, Math.sin(angle) * orbitR],
        right: [Math.cos(angle + Math.PI) * orbitR, Math.sin(angle + Math.PI) * orbitR]
      })
    }
  },
  {
    when: s => s.mood === 'sleeping',
    draw(ctx, palette) {
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1.2
      for (const dx of [-EYE_DX, EYE_DX]) {
        ctx.beginPath()
        ctx.arc(CX + dx, EYE_Y + 1, 2.5, Math.PI, 0, true)
        ctx.stroke()
      }
    }
  },
  {
    when: s => s.mood === 'surprised',
    draw(ctx, palette, s) {
      const p = s.surprisedTimer / 0.5
      eyeDots(ctx, palette.eye, 3.5 - p * 1.5)
    }
  },
  {
    when: s => s.event === 'sneeze',
    draw(ctx, palette, s) {
      if (s.eventProgress < 0.3) {
        // Squeezed shut
        ctx.strokeStyle = palette.eye
        ctx.lineWidth = 1.2
        for (const dx of [-EYE_DX, EYE_DX]) {
          ctx.beginPath()
          ctx.arc(CX + dx, EYE_Y + 2, 3.5, Math.PI * 0.7, Math.PI * 0.3, true)
          ctx.stroke()
        }
      } else {
        eyeDots(ctx, palette.eye, 1.5)
      }
    }
  },
  {
    when: s => s.event === 'heart',
    draw(ctx, palette, s) {
      ctx.fillStyle = '#ff4081'
      ctx.globalAlpha = s.eventBlend
      drawHeart(ctx, CX - EYE_DX, EYE_Y, 2.5 * s.eventBlend)
      drawHeart(ctx, CX + EYE_DX, EYE_Y, 2.5 * s.eventBlend)
      ctx.globalAlpha = 1
    }
  },
  {
    when: s => s.event === 'curious',
    draw(ctx, palette, s) {
      const lx = (s.lookX || 0) * s.eventBlend
      const dy = -1 - s.eventProgress * 0.5
      eyeDots(ctx, palette.eye, 1.5 + s.eventBlend * 0.5, { left: [lx, dy], right: [lx, dy] })
    }
  },
  {
    when: s => s.event === 'excited',
    draw(ctx, palette, s) {
      eyeDots(ctx, palette.eye, 1.5 + s.eventBlend * 0.3)
      if (Math.sin(s.eventTime * 15) > 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${0.9 * s.eventBlend})`
        dot(ctx, CX - 3, EYE_Y - 1, 0.8)
        dot(ctx, CX + 5, EYE_Y - 1, 0.8)
      }
    }
  },
  {
    when: s => s.event === 'confused',
    draw(ctx, palette, s) {
      ctx.fillStyle = palette.eye
      dot(ctx, CX - EYE_DX, EYE_Y, 1.5 + s.eventBlend * 0.5)
      dot(ctx, CX + 5, EYE_Y + 1, 1.2 * s.eventBlend + 0.3)
    }
  },
  {
    when: s => s.blink && eyeBlend(s) < 0.5,
    draw(ctx, palette, s) {
      const halfWidth = s.timePeriod === 'night' ? 1.2 : 1.5
      const lx = s.lookX || 0
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1
      for (const dx of [-EYE_DX, EYE_DX]) {
        ctx.beginPath()
        ctx.moveTo(CX + dx - halfWidth + lx, EYE_Y)
        ctx.lineTo(CX + dx + halfWidth + lx, EYE_Y)
        ctx.stroke()
      }
    }
  },
  {
    when: () => true,
    draw(ctx, palette, s) {
      const blend = eyeBlend(s)
      const lx = s.lookX || 0
      const ly = s.lookY || 0
      eyeDots(ctx, palette.eye, 1.5 + blend, { left: [lx, ly], right: [lx, ly] })

      if (blend > 0.1) {
        ctx.fillStyle = palette.cheek
        ctx.globalAlpha = blend
        dot(ctx, CX - 7, EYE_Y + 3, 2)
        dot(ctx, CX + 7, EYE_Y + 3, 2)
        ctx.globalAlpha = 1
      }
    }
  }
]

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

    // Time-of-day overlay
    if (state && state.timePeriod) {
      if (state.timePeriod === 'evening') {
        ctx.fillStyle = 'rgba(255, 180, 100, 0.08)'
        ctx.fillRect(x, y, hw, hh)
      } else if (state.timePeriod === 'night') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
        ctx.fillRect(x, y, hw, hh)
      }
    }

    const vx = cx - 10
    const vy = cy - 6
    const vw = 20
    const vh = 12

    if (state && state.event === 'rainbow') {
      const hue = state.eventProgress * 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.globalAlpha = 0.3 + state.eventBlend * 0.7
    } else {
      ctx.fillStyle = palette.visor
    }

    ctx.beginPath()
    ctx.roundRect(vx, vy, vw, vh, 2)
    ctx.fill()
    if (state && state.event === 'rainbow') ctx.globalAlpha = 1

    // Letter display
    if (state && state.displayLetter) {
      ctx.fillStyle = '#d0d0d0'
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.globalAlpha = Math.min(1, state.displayLetterTimer || 1)
      ctx.fillText(state.displayLetter, cx, cy + 20)
      ctx.globalAlpha = 1
    }
  },

  drawEyes(ctx, palette, state, time) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(6, 10, 20, 12, 2)
    ctx.clip()

    const render = EYE_RENDERERS.find(r => r.when(state))
    render.draw(ctx, palette, state)

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
    const isPulsing = state && state.antennaPulse
    const glow = isSurprised ? 1 : isPulsing ? Math.sin(time * 4) * 0.35 + 0.65 : Math.sin(time * 3) * 0.3 + 0.7

    ctx.fillStyle = palette.glow
    ctx.globalAlpha = glow
    ctx.beginPath()
    ctx.arc(cx, topY, isSurprised ? 2.5 : isPulsing ? 2.0 : 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    if (state && state.halo) {
      ctx.save()
      ctx.translate(cx, topY - 5)
      ctx.rotate(Math.sin(time * 0.5) * 0.15)
      ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.3
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  },

  /** Drawn behind the head: the 100-day "supreme" aura. */
  drawAura(ctx, palette, state, time) {
    if (!state.supreme) return
    ctx.save()
    ctx.globalAlpha = 0.2
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `hsl(${(time * 30 + i * 90) % 360}, 100%, 70%)`
      ctx.beginPath()
      ctx.arc(CX, CY, 6 + i * 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  },

  /** Drawn over everything: sleeping "z" and the 25-day golden border. */
  drawOverlay(ctx, palette, state, time) {
    if (state.mood === 'sleeping') {
      const bob = Math.sin(time * 2) * 0.6
      const pulse = Math.sin(time * 2.5) * 0.15 + 0.85
      ctx.fillStyle = `rgba(100, 200, 255, ${0.4 + pulse * 0.2})`
      ctx.font = `${Math.round(3 * pulse)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('z', 16.5 + bob * 0.2, 1 + bob)
    }

    if (state.golden) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(time * 2) * 0.3})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(0, 2, 32, 28, 4)
      ctx.stroke()
    }
  },

  drawAccessory(ctx, palette, state, time) {
    if (!state.accessory) return
    const acc = accessories.get(state.accessory)
    if (acc) {
      acc.draw(ctx, palette, state, time)
    }
  }
}
