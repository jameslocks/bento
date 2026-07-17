export class SoundEngine {
  constructor() {
    this._ctx = null
  }

  _ensureContext() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        // Audio not available — sounds will be silent
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {})
    }
  }

  _play(frequency, duration, type = 'sine', volume = 0.15) {
    this._ensureContext()
    if (!this._ctx) return

    const osc = this._ctx.createOscillator()
    const gain = this._ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, this._ctx.currentTime)

    gain.gain.setValueAtTime(volume, this._ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, this._ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(this._ctx.destination)

    osc.start(this._ctx.currentTime)
    osc.stop(this._ctx.currentTime + duration)
  }

  chirp() {
    this._ensureContext()
    if (!this._ctx) return

    const now = this._ctx.currentTime

    if (Math.random() > 0.4) {
      // Single warbling chirp with harmonics
      const osc1 = this._ctx.createOscillator()
      const osc2 = this._ctx.createOscillator()
      const gain = this._ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'triangle'

      osc1.frequency.setValueAtTime(2200 + Math.random() * 600, now)
      osc1.frequency.exponentialRampToValueAtTime(600 + Math.random() * 300, now + 0.05)
      osc1.frequency.linearRampToValueAtTime(900 + Math.random() * 300, now + 0.08)
      osc1.frequency.exponentialRampToValueAtTime(400 + Math.random() * 200, now + 0.12)

      osc2.frequency.setValueAtTime(1800 + Math.random() * 400, now)
      osc2.frequency.exponentialRampToValueAtTime(500 + Math.random() * 200, now + 0.05)
      osc2.frequency.linearRampToValueAtTime(700 + Math.random() * 200, now + 0.08)
      osc2.frequency.exponentialRampToValueAtTime(300 + Math.random() * 200, now + 0.12)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02)
      gain.gain.linearRampToValueAtTime(0, now + 0.12)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this._ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.13)
      osc2.stop(now + 0.13)
    } else {
      // Double chirp — two quick bursts
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.065
        const osc = this._ctx.createOscillator()
        const g = this._ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(1800 + Math.random() * 700, t)
        osc.frequency.exponentialRampToValueAtTime(500 + Math.random() * 300, t + 0.035)

        g.gain.setValueAtTime(0.12, t)
        g.gain.linearRampToValueAtTime(0, t + 0.045)

        osc.connect(g)
        g.connect(this._ctx.destination)

        osc.start(t)
        osc.stop(t + 0.05)
      }
    }
  }

  boop() {
    const freq = 350 + Math.random() * 170
    const dur = 0.12 + Math.random() * 0.08
    this._play(freq, dur, 'triangle')
  }

  happy() {
    this._ensureContext()
    if (!this._ctx) return

    const now = this._ctx.currentTime
    const baseFreq = 600 + Math.random() * 120
    const notes = [baseFreq, baseFreq * (1.25 + Math.random() * 0.15)]
    notes.forEach((freq, i) => {
      const osc = this._ctx.createOscillator()
      const gain = this._ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.1)
      gain.gain.setValueAtTime(0.15, now + i * 0.1)
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.15)
      osc.connect(gain)
      gain.connect(this._ctx.destination)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.15)
    })
  }
}