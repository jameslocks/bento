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

  drawHead(ctx, palette, time) {
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
    ctx.fillStyle = palette.visor
    ctx.beginPath()
    ctx.roundRect(vx, vy, vw, vh, 2)
    ctx.fill()
  },

  drawEyes(ctx, palette, state, time) {
    const cx = 16
    const cy = 16
    const eyeY = cy + 1

    if (state.mood === 'happy') {
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = palette.cheek
      ctx.beginPath()
      ctx.arc(cx - 7, eyeY + 3, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 7, eyeY + 3, 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (state.blink) {
      ctx.strokeStyle = palette.eye
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx - 5.5, eyeY)
      ctx.lineTo(cx - 2.5, eyeY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 2.5, eyeY)
      ctx.lineTo(cx + 5.5, eyeY)
      ctx.stroke()
    } else {
      ctx.fillStyle = palette.eye
      ctx.beginPath()
      ctx.arc(cx - 4, eyeY, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 4, eyeY, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  },

  drawAntenna(ctx, palette, time) {
    const cx = 16
    const topY = 4

    ctx.strokeStyle = palette.antenna
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, topY + 3)
    ctx.lineTo(cx, topY)
    ctx.stroke()

    const glow = Math.sin(time * 3) * 0.3 + 0.7
    ctx.fillStyle = palette.glow
    ctx.globalAlpha = glow
    ctx.beginPath()
    ctx.arc(cx, topY, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}