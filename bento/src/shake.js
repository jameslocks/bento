export class ShakeDetector {
  constructor(onShake, threshold = 20, cooldown = 3) {
    this._onShake = onShake
    this._threshold = threshold
    this._cooldown = cooldown
    this._lastShake = 0
    this._handler = null
    this._enabled = false

    this.supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window
    // iOS 13+ gates motion events behind a permission prompt that needs a user gesture.
    this.needsPermission = this.supported &&
      typeof DeviceMotionEvent.requestPermission === 'function'

    if (this.supported && !this.needsPermission) this._listen()
  }

  /** Call from a user gesture (e.g. a tap). Safe to call repeatedly. */
  async enable() {
    if (!this.supported || this._enabled) return
    if (this.needsPermission) {
      try {
        const result = await DeviceMotionEvent.requestPermission()
        if (result !== 'granted') return
      } catch {
        return
      }
    }
    this._listen()
  }

  _listen() {
    if (this._enabled) return
    this._enabled = true
    this._handler = (e) => this._handle(e)
    window.addEventListener('devicemotion', this._handler)
  }

  _handle(e) {
    const a = e.accelerationIncludingGravity
    if (!a) return
    const total = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
    const now = performance.now()
    if (total > this._threshold && (now - this._lastShake) > this._cooldown * 1000) {
      this._lastShake = now
      this._onShake()
    }
  }

  destroy() {
    if (this._handler) window.removeEventListener('devicemotion', this._handler)
    this._enabled = false
  }
}
