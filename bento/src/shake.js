export class ShakeDetector {
  constructor(onShake, threshold = 20, cooldown = 3) {
    this._onShake = onShake
    this._threshold = threshold
    this._cooldown = cooldown
    this._lastShake = 0
    this._handler = null

    if ('DeviceMotionEvent' in window) {
      this._handler = (e) => this._handle(e)
      window.addEventListener('devicemotion', this._handler)
    }
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
    if (this._handler) {
      window.removeEventListener('devicemotion', this._handler)
    }
  }
}