export const accessories = new Map()

function drawPartyHat(ctx, palette, state, time) {
  const cx = 16
  const topY = 4

  // Cone
  ctx.fillStyle = '#ff4081'
  ctx.beginPath()
  ctx.moveTo(cx, topY - 7)
  ctx.lineTo(cx - 6, topY + 2)
  ctx.lineTo(cx + 6, topY + 2)
  ctx.closePath()
  ctx.fill()

  // Brim
  ctx.fillStyle = '#ffd54f'
  ctx.fillRect(cx - 7, topY + 1, 14, 1.5)

  // Pompom
  ctx.fillStyle = '#ffd54f'
  ctx.beginPath()
  ctx.arc(cx, topY - 7, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Stripes
  ctx.strokeStyle = '#ffd54f'
  ctx.lineWidth = 0.5
  for (let i = 1; i <= 3; i++) {
    const t = i / 4
    const leftX = cx - 6 + t * 6
    const rightX = cx + 6 - t * 6
    const y = topY + 2 - t * 9
    ctx.beginPath()
    ctx.moveTo(leftX, y)
    ctx.lineTo(rightX, y)
    ctx.stroke()
  }
}

function drawBowtie(ctx, palette, state, time) {
  const cx = 16
  const bowY = 29

  ctx.fillStyle = '#e040fb'
  // Left wing
  ctx.beginPath()
  ctx.moveTo(cx, bowY)
  ctx.lineTo(cx - 6, bowY - 3)
  ctx.lineTo(cx - 6, bowY + 3)
  ctx.closePath()
  ctx.fill()
  // Right wing
  ctx.beginPath()
  ctx.moveTo(cx, bowY)
  ctx.lineTo(cx + 6, bowY - 3)
  ctx.lineTo(cx + 6, bowY + 3)
  ctx.closePath()
  ctx.fill()
  // Center knot
  ctx.fillStyle = '#ce93d8'
  ctx.beginPath()
  ctx.arc(cx, bowY, 1.2, 0, Math.PI * 2)
  ctx.fill()
}

function drawSunglasses(ctx, palette, state, time) {
  const cx = 16
  const eyeY = 17
  const frameColor = '#222'
  const lensColor = 'rgba(30, 30, 50, 0.7)'

  // Left lens
  ctx.fillStyle = frameColor
  ctx.fillRect(cx - 7, eyeY - 2, 6, 5)
  ctx.fillStyle = lensColor
  ctx.fillRect(cx - 6, eyeY - 1, 5, 4)
  // Right lens
  ctx.fillStyle = frameColor
  ctx.fillRect(cx + 1, eyeY - 2, 6, 5)
  ctx.fillStyle = lensColor
  ctx.fillRect(cx + 1.5, eyeY - 1, 5, 4)
  // Bridge
  ctx.fillStyle = frameColor
  ctx.fillRect(cx - 1, eyeY - 1, 2, 2)
  // Arms
  ctx.strokeStyle = frameColor
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(cx - 7, eyeY)
  ctx.lineTo(cx - 9, eyeY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 7, eyeY)
  ctx.lineTo(cx + 9, eyeY)
  ctx.stroke()
}

function drawEarmuffs(ctx, palette, state, time) {
  const cx = 16
  const cy = 16

  // Band across top
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, 14, Math.PI * 0.85, Math.PI * 0.15, false)
  ctx.stroke()

  // Left muff
  ctx.fillStyle = '#e57373'
  ctx.beginPath()
  ctx.ellipse(cx - 14, cy, 3, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ef5350'
  ctx.lineWidth = 0.8
  ctx.stroke()
  // Right muff
  ctx.beginPath()
  ctx.ellipse(cx + 14, cy, 3, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawCrown(ctx, palette, state, time) {
  const cx = 16
  const topY = 3

  ctx.fillStyle = '#ffd700'
  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 0.5

  // Crown shape: 3 points
  ctx.beginPath()
  ctx.moveTo(cx - 6, topY + 4)
  ctx.lineTo(cx - 6, topY - 2)
  ctx.lineTo(cx - 4, topY - 0)
  ctx.lineTo(cx, topY - 5)
  ctx.lineTo(cx + 4, topY - 0)
  ctx.lineTo(cx + 6, topY - 2)
  ctx.lineTo(cx + 6, topY + 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Jewels
  ctx.fillStyle = '#ff4081'
  ctx.beginPath()
  ctx.arc(cx, topY - 2, 0.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#4fc3f7'
  ctx.beginPath()
  ctx.arc(cx - 4, topY + 1, 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 4, topY + 1, 0.6, 0, Math.PI * 2)
  ctx.fill()
}

accessories.set('partyhat', { key: 'partyhat', name: 'Party Hat', draw: drawPartyHat })
accessories.set('bowtie', { key: 'bowtie', name: 'Bowtie', draw: drawBowtie })
accessories.set('sunglasses', { key: 'sunglasses', name: 'Sunglasses', draw: drawSunglasses })
accessories.set('earmuffs', { key: 'earmuffs', name: 'Earmuffs', draw: drawEarmuffs })
accessories.set('crown', { key: 'crown', name: 'Crown', draw: drawCrown })
