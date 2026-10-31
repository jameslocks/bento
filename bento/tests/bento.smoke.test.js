import { describe, it, expect, beforeEach, vi } from 'vitest'

function stubCtx() {
  const calls = []
  const ctx = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'calls') return calls
      return (...args) => { calls.push(prop); return undefined }
    },
    set: () => true
  })
  return ctx
}

function stubCanvas() {
  const ctx = stubCtx()
  const listeners = {}
  return {
    ctx,
    listeners,
    width: 0,
    height: 0,
    style: {},
    getContext: () => ctx,
    addEventListener: (type, fn) => { listeners[type] = fn },
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0 })
  }
}

beforeEach(() => {
  const map = new Map()
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v))
  }
  globalThis.window = { innerWidth: 400, innerHeight: 800, devicePixelRatio: 2 }
})

async function makeBento() {
  const { Bento } = await import('../src/bento.js')
  const { defaultSkin } = await import('../src/skins/default.js')
  const sound = new Proxy({}, { get: () => () => {} })
  const canvas = stubCanvas()
  return { bento: new Bento(canvas, defaultSkin, sound), canvas }
}

describe('Bento smoke', () => {
  it('sizes the canvas on a grid multiple, scaled for devicePixelRatio', async () => {
    const { canvas } = await makeBento()
    expect(canvas.style.width).toBe('352px') // 11px per grid unit * 32
    expect(canvas.width).toBe(704)
    expect(canvas.height).toBe(1056)
  })

  it('updates and draws through every event and mood without throwing', async () => {
    const { bento } = await makeBento()
    const events = ['glitch', 'spin', 'sneeze', 'rainbow', 'heart', 'curious', 'excited', 'confused', 'dizzy']
    for (const name of events) {
      bento.triggerEvent(name)
      for (let i = 0; i < 150; i++) { bento._update(1 / 60); bento._draw() }
    }
    bento.sleep(1); bento._update(0.1); bento._draw()
    bento.surprise(); bento._update(0.1); bento._draw()
    bento.makeHappy(); bento._update(0.1); bento._draw()
    bento.spawnPanko()
    for (let i = 0; i < 60 * 20; i++) { bento._update(1 / 60); bento._draw() }
  })

  it('keeps event progress in range and ends events', async () => {
    const { bento } = await makeBento()
    bento.triggerEvent('spin')
    bento._update(0.4)
    expect(bento._drawState().eventProgress).toBeCloseTo(0.5)
    bento._update(1)
    expect(bento.debugState().event).toBe(null)
  })

  it('ignores unknown event names', async () => {
    const { bento } = await makeBento()
    bento.triggerEvent('nope')
    expect(bento.debugState().event).toBe(null)
  })

  it('wakes a sleeping Bento on tap', async () => {
    const { bento, canvas } = await makeBento()
    bento.sleep(5)
    canvas.listeners.click({ cancelable: false, clientX: 5, clientY: 5 })
    expect(bento.mood).toBe('surprised')
  })

  it('catches the firefly where it is drawn', async () => {
    const { bento, canvas } = await makeBento()
    bento.firefly.active = true
    bento.firefly.x = 10
    bento.firefly.y = 12
    const scale = bento._scale
    const bounce = bento._getBounceOffset()
    canvas.listeners.click({ cancelable: false, clientX: 10 * scale, clientY: 12 * scale + bounce })
    expect(bento.firefly.active).toBe(false)
  })

  it('does not run a huge dt through the timers', async () => {
    const { bento } = await makeBento()
    const before = bento._time
    bento._lastTime = 0
    bento._rafId = null
    vi.stubGlobal('requestAnimationFrame', () => 1)
    bento._loop(60000)
    expect(bento._time - before).toBeLessThanOrEqual(0.1)
  })
})
