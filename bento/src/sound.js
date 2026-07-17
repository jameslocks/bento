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
    const types = ['sine', 'triangle']
    const freq = 700 + Math.random() * 400
    const type = types[Math.floor(Math.random() * types.length)]
    const dur = 0.06 + Math.random() * 0.08
    this._play(freq, dur, type)
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