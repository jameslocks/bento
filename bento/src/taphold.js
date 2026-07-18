export class TapHoldDetector {
  constructor(element, callback, threshold = 600) {
    this._element = element
    this._callback = callback
    this._threshold = threshold
    this._timer = null

    this._onPointerDown = this._onPointerDown.bind(this)
    this._onPointerUp = this._onPointerUp.bind(this)
    this._onPointerLeave = this._onPointerLeave.bind(this)

    element.addEventListener('pointerdown', this._onPointerDown)
    element.addEventListener('pointerup', this._onPointerUp)
    element.addEventListener('pointerleave', this._onPointerLeave)
  }

  _onPointerDown(e) {
    this._timer = setTimeout(() => {
      this._callback(e)
    }, this._threshold)
  }

  _onPointerUp(e) {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  _onPointerLeave() {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  destroy() {
    this._element.removeEventListener('pointerdown', this._onPointerDown)
    this._element.removeEventListener('pointerup', this._onPointerUp)
    this._element.removeEventListener('pointerleave', this._onPointerLeave)
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }
}
